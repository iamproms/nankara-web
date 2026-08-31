from sqlalchemy import select

from app.models import Order, OrderStatus, Payment, PaymentStatus


def _start_payment(client, db, order):
    """Run initialize so a PENDING payment row exists, return it."""
    client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    return db.scalar(select(Payment).where(Payment.order_id == order.id))


def _charge_success(reference, amount_kobo, currency="NGN"):
    return {
        "event": "charge.success",
        "data": {
            "reference": reference,
            "amount": amount_kobo,
            "currency": currency,
            "status": "success",
        },
    }


def test_webhook_rejects_missing_signature(client):
    res = client.post(
        "/api/v1/payments/paystack/webhook", json=_charge_success("NK-X", 1000)
    )
    assert res.status_code == 401


def test_webhook_rejects_bad_signature(client, paystack_secret):
    res = client.post(
        "/api/v1/payments/paystack/webhook",
        json=_charge_success("NK-X", 1000),
        headers={"x-paystack-signature": "deadbeef"},
    )
    assert res.status_code == 401


def test_webhook_marks_order_paid(client, db, make_order, fake_paystack, signed_webhook):
    order = make_order(price_ngn=100000)  # total 105000
    payment = _start_payment(client, db, order)

    raw, headers = signed_webhook(
        _charge_success(payment.provider_reference, payment.amount)
    )
    res = client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    assert res.status_code == 200

    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PAID
    reloaded = db.get(Payment, payment.id)
    assert reloaded.status == PaymentStatus.SUCCESS
    assert reloaded.verified_at is not None
    assert reloaded.raw_event["event"] == "charge.success"


def test_webhook_is_idempotent(client, db, make_order, fake_paystack, signed_webhook):
    order = make_order()
    payment = _start_payment(client, db, order)
    raw, headers = signed_webhook(
        _charge_success(payment.provider_reference, payment.amount)
    )

    client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    res = client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    assert res.status_code == 200

    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PAID
    assert (
        len(list(db.scalars(select(Payment).where(Payment.order_id == order.id)))) == 1
    )


def test_webhook_amount_mismatch_does_not_pay(
    client, db, make_order, fake_paystack, signed_webhook
):
    order = make_order()
    payment = _start_payment(client, db, order)

    raw, headers = signed_webhook(
        _charge_success(payment.provider_reference, payment.amount - 100)
    )
    res = client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    assert res.status_code == 200

    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PENDING_PAYMENT
    assert db.get(Payment, payment.id).status == PaymentStatus.FAILED


def test_webhook_unknown_reference_is_noop(client, db, make_order, signed_webhook):
    order = make_order()
    raw, headers = signed_webhook(_charge_success("NK-GHOST99", 999900))
    res = client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    assert res.status_code == 200
    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PENDING_PAYMENT


def test_webhook_ignores_other_events(client, db, make_order, fake_paystack, signed_webhook):
    order = make_order()
    payment = _start_payment(client, db, order)
    raw, headers = signed_webhook(
        {"event": "charge.failed", "data": {"reference": payment.provider_reference}}
    )
    res = client.post("/api/v1/payments/paystack/webhook", content=raw, headers=headers)
    assert res.status_code == 200
    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PENDING_PAYMENT
