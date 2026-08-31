from sqlalchemy import select

from app.models import Availability, Order

CONTACT = {
    "first_name": "Ada",
    "last_name": "Obi",
    "email": "ada@example.com",
    "phone": "+2348012345678",
}
DELIVERY_NG = {
    "country_code": "NG",
    "country_name": "Nigeria",
    "address_1": "12 Aptech Close",
    "address_2": "",
    "city": "Port Harcourt",
    "state_region": "Rivers",
    "postal_code": "",
    "notes": "",
}


def _payload(items, delivery=None):
    return {"contact": CONTACT, "delivery": delivery or DELIVERY_NG, "items": items}


def test_create_order_happy_path(client, db, seeded_zones, make_product):
    a = make_product(price_ngn=150000)
    b = make_product(price_ngn=95000)

    res = client.post(
        "/api/v1/orders",
        json=_payload([
            {"product_id": a.id, "quantity": 2},
            {"product_id": b.id, "quantity": 1},
        ]),
    )
    assert res.status_code == 201
    body = res.json()

    assert body["reference"].startswith("NK-")
    assert body["status"] == "PENDING_PAYMENT"
    assert body["subtotal"] == 150000 * 2 + 95000
    assert body["shipping_amount"] == 5000  # Rivers
    assert body["total"] == body["subtotal"] + 5000
    assert {i["product_name"] for i in body["items"]} == {a.name, b.name}
    # Public-safe view — no phone / full address.
    assert body["customer"] == {"first_name": "Ada", "email": "ada@example.com"}
    assert body["delivery"] == {
        "city": "Port Harcourt",
        "state_region": "Rivers",
        "country": "Nigeria",
    }

    order = db.scalar(select(Order).where(Order.reference == body["reference"]))
    assert order is not None
    assert order.customer_phone == "+2348012345678"  # stored, just not exposed


def test_unit_price_comes_from_db_not_payload(client, db, seeded_zones, make_product):
    product = make_product(price_ngn=200000)
    res = client.post(
        "/api/v1/orders",
        json=_payload([
            {"product_id": product.id, "quantity": 1, "unit_price": 1, "subtotal": 1},
        ]),
    )
    assert res.status_code == 201
    body = res.json()
    assert body["items"][0]["unit_price"] == 200000
    assert body["subtotal"] == 200000


def test_rejects_unpublished_product(client, seeded_zones, make_product):
    product = make_product(is_published=False)
    res = client.post(
        "/api/v1/orders", json=_payload([{"product_id": product.id, "quantity": 1}])
    )
    assert res.status_code == 409
    detail = res.json()["detail"]
    assert detail["items"][0] == {"product_id": product.id, "reason": "unavailable"}


def test_rejects_out_of_stock_product(client, seeded_zones, make_product):
    product = make_product(availability=Availability.OUT_OF_STOCK)
    res = client.post(
        "/api/v1/orders", json=_payload([{"product_id": product.id, "quantity": 1}])
    )
    assert res.status_code == 409
    item = res.json()["detail"]["items"][0]
    assert item["reason"] == "out_of_stock"
    assert item["product_name"] == product.name


def test_rejects_empty_items(client, seeded_zones):
    res = client.post("/api/v1/orders", json=_payload([]))
    assert res.status_code == 422


def test_rejects_unquotable_destination(client, db, seeded_zones, make_product):
    product = make_product()
    for zone in seeded_zones:
        zone.is_active = False
    db.flush()

    res = client.post(
        "/api/v1/orders", json=_payload([{"product_id": product.id, "quantity": 1}])
    )
    assert res.status_code == 422
