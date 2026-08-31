from sqlalchemy import select

from app.models import OrderStatus, Payment, PaymentStatus


def select_payment(order_id: int):
    return (
        select(Payment)
        .where(Payment.order_id == order_id)
        .order_by(Payment.id.desc())
        .limit(1)
    )


def test_initialize_creates_pending_payment(client, db, make_order, fake_paystack):
    order = make_order(price_ngn=150000)  # total = 150000 + 5000 shipping

    res = client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["authorization_url"] == "https://checkout.paystack.com/xyz123"
    assert body["reference"] == order.reference

    payment = db.scalar(select_payment(order.id))
    assert payment.status == PaymentStatus.PENDING
    assert payment.amount == (150000 + 5000) * 100  # kobo
    assert fake_paystack.init_calls[0]["amount_kobo"] == (150000 + 5000) * 100
    assert fake_paystack.init_calls[0]["callback_url"].endswith(
        f"/order/{order.reference}/success"
    )


def test_initialize_unknown_reference(client, fake_paystack):
    res = client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": "NK-NOPE0000"}
    )
    assert res.status_code == 404


def test_initialize_rejects_already_paid_order(client, db, make_order, fake_paystack):
    order = make_order()
    order.status = OrderStatus.PAID
    db.flush()

    res = client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    assert res.status_code == 409


def test_initialize_requires_paystack_config(client, make_order):
    order = make_order()
    res = client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    assert res.status_code == 503


def test_retry_gets_a_fresh_reference(client, db, make_order, fake_paystack):
    order = make_order()

    client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    # Mark the first attempt spent, then retry.
    first = db.scalar(select_payment(order.id))
    first.status = PaymentStatus.FAILED
    db.flush()

    res = client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    assert res.status_code == 200
    assert res.json()["reference"] == f"{order.reference}-2"
