from app.models import OrderStatus


def test_list_requires_auth(client, make_order):
    make_order()
    assert client.get("/api/v1/admin/orders").status_code in (401, 403)


def test_list_returns_orders_newest_first(client, db, make_order, auth_headers):
    a = make_order(price_ngn=100000)
    b = make_order(price_ngn=200000)

    res = client.get("/api/v1/admin/orders", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert [o["reference"] for o in body][:2] == [b.reference, a.reference]
    assert body[0]["customer_name"] == "Ada Obi"
    assert body[0]["payment_status"] is None


def test_list_filters_by_status(client, db, make_order, auth_headers):
    paid = make_order()
    paid.status = OrderStatus.PAID
    make_order()  # stays PENDING_PAYMENT
    db.flush()

    res = client.get("/api/v1/admin/orders?status=PAID", headers=auth_headers)
    assert res.status_code == 200
    assert [o["reference"] for o in res.json()] == [paid.reference]


def test_detail_exposes_full_customer_and_address(client, make_order, auth_headers):
    order = make_order()
    res = client.get(f"/api/v1/admin/orders/{order.id}", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["customer"]["phone"] == "+2348012345678"
    assert body["delivery"]["address_1"] == "12 Aptech Close"
    assert body["payment"] is None
    assert body["items"][0]["quantity"] == 1


def test_detail_404(client, auth_headers):
    assert (
        client.get("/api/v1/admin/orders/999999", headers=auth_headers).status_code
        == 404
    )


def test_status_transition_forward(client, db, make_order, auth_headers):
    order = make_order()
    order.status = OrderStatus.PAID
    db.flush()

    res = client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        headers=auth_headers,
        json={"status": "IN_PRODUCTION"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "IN_PRODUCTION"


def test_status_transition_illegal_jump(client, db, make_order, auth_headers):
    order = make_order()
    order.status = OrderStatus.PAID
    db.flush()

    res = client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        headers=auth_headers,
        json={"status": "SHIPPED"},
    )
    assert res.status_code == 409


def test_status_cannot_be_set_to_paid_by_hand(client, make_order, auth_headers):
    order = make_order()  # PENDING_PAYMENT
    res = client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        headers=auth_headers,
        json={"status": "PAID"},
    )
    assert res.status_code == 409
