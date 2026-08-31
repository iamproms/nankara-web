from app.models import OrderStatus


def test_overview_includes_order_counts(client, db, make_order, auth_headers):
    make_order()  # PENDING_PAYMENT
    paid = make_order()
    paid.status = OrderStatus.PAID
    prod = make_order()
    prod.status = OrderStatus.IN_PRODUCTION
    ready = make_order()
    ready.status = OrderStatus.READY
    db.flush()

    res = client.get("/api/v1/admin/overview", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["pending_payment_orders"] == 1
    assert body["paid_orders"] == 1
    assert body["in_production_orders"] == 1
    assert body["awaiting_shipment_orders"] == 1
