from app.models import OrderStatus


def test_list_requires_auth(client, make_order):
    make_order()
    assert client.get("/api/v1/admin/orders").status_code in (401, 403)


def test_list_returns_orders_newest_first(admin_client, db, make_order):
    a = make_order(price_ngn=100000)
    b = make_order(price_ngn=200000)

    res = admin_client.get("/api/v1/admin/orders")
    assert res.status_code == 200
    body = res.json()
    assert [o["reference"] for o in body][:2] == [b.reference, a.reference]
    assert body[0]["customer_name"] == "Ada Obi"
    assert body[0]["payment_status"] is None


def test_list_filters_by_status(admin_client, db, make_order):
    paid = make_order()
    paid.status = OrderStatus.PAID
    make_order()  # stays PENDING_PAYMENT
    db.flush()

    res = admin_client.get("/api/v1/admin/orders?status=PAID")
    assert res.status_code == 200
    assert [o["reference"] for o in res.json()] == [paid.reference]


def test_detail_exposes_full_customer_and_address(admin_client, make_order):
    order = make_order()
    res = admin_client.get(f"/api/v1/admin/orders/{order.id}")
    assert res.status_code == 200
    body = res.json()
    assert body["customer"]["phone"] == "+2348012345678"
    assert body["delivery"]["address_1"] == "12 Aptech Close"
    assert body["payment"] is None
    assert body["items"][0]["quantity"] == 1


def test_detail_404(admin_client):
    assert (
        admin_client.get("/api/v1/admin/orders/999999").status_code
        == 404
    )


def test_status_transition_forward(admin_client, db, make_order):
    order = make_order()
    order.status = OrderStatus.PAID
    db.flush()

    res = admin_client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        json={"status": "IN_PRODUCTION"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "IN_PRODUCTION"


def test_status_transition_illegal_jump(admin_client, db, make_order):
    order = make_order()
    order.status = OrderStatus.PAID
    db.flush()

    res = admin_client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        json={"status": "SHIPPED"},
    )
    assert res.status_code == 409


def test_status_cannot_be_set_to_paid_by_hand(admin_client, make_order):
    order = make_order()  # PENDING_PAYMENT
    res = admin_client.patch(
        f"/api/v1/admin/orders/{order.id}/status",
        json={"status": "PAID"},
    )
    assert res.status_code == 409


def test_detail_shows_linked_account(admin_client, db, make_order):
    from app.models import User

    order = make_order()
    user = User(
        email="linked@example.com", password_hash="x",
        first_name="L", last_name="K", email_verified=True,
    )
    db.add(user)
    db.flush()
    order.user_id = user.id
    db.flush()

    body = admin_client.get(f"/api/v1/admin/orders/{order.id}").json()
    assert body["account"]["email"] == "linked@example.com"
    assert body["account"]["email_verified"] is True
