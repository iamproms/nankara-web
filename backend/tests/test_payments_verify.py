from sqlalchemy import select

from app.models import Order, OrderStatus, Payment


def _start_payment(client, db, order):
    client.post(
        "/api/v1/payments/paystack/initialize", json={"reference": order.reference}
    )
    return db.scalar(select(Payment).where(Payment.order_id == order.id))


def test_verify_success_marks_paid(client, db, make_order, fake_paystack):
    order = make_order(price_ngn=120000)  # total 125000
    payment = _start_payment(client, db, order)
    fake_paystack.verify_result = {
        "status": "success",
        "amount": payment.amount,
        "currency": "NGN",
    }

    res = client.post(
        "/api/v1/payments/paystack/verify", json={"reference": order.reference}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "PAID"

    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PAID


def test_verify_failed_leaves_order_pending(client, db, make_order, fake_paystack):
    order = make_order()
    _start_payment(client, db, order)
    fake_paystack.verify_result = {"status": "failed", "amount": 0, "currency": "NGN"}

    res = client.post(
        "/api/v1/payments/paystack/verify", json={"reference": order.reference}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "PENDING_PAYMENT"

    db.expire_all()
    assert db.get(Order, order.id).status == OrderStatus.PENDING_PAYMENT


def test_verify_unknown_order(client, fake_paystack):
    res = client.post(
        "/api/v1/payments/paystack/verify", json={"reference": "NK-NOPE0000"}
    )
    assert res.status_code == 404
