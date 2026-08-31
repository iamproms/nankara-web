from app.models import OrderStatus


def test_overview_includes_order_counts(admin_client, db, make_order):
    make_order()  # PENDING_PAYMENT
    paid = make_order()
    paid.status = OrderStatus.PAID
    prod = make_order()
    prod.status = OrderStatus.IN_PRODUCTION
    ready = make_order()
    ready.status = OrderStatus.READY
    db.flush()

    res = admin_client.get("/api/v1/admin/overview")
    assert res.status_code == 200
    body = res.json()
    assert body["pending_payment_orders"] == 1
    assert body["paid_orders"] == 1
    assert body["in_production_orders"] == 1
    assert body["awaiting_shipment_orders"] == 1
