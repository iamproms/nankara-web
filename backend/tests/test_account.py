from sqlalchemy import select

from app.core.security import SESSION_COOKIE_CUSTOMER, create_link_token
from app.models import Order, User

REG = {
    "email": "new@example.com",
    "password": "customer-pass",
    "first_name": "Nia",
    "last_name": "Bello",
}


# ── register / login / session ───────────────────────────────────────────────

def test_register_sets_cookie_and_sends_verification(client, fake_resend):
    res = client.post("/api/v1/account/register", json=REG)
    assert res.status_code == 201
    assert SESSION_COOKIE_CUSTOMER in res.headers.get("set-cookie", "")
    assert res.json()["email_verified"] is False
    assert len(fake_resend) == 1 and fake_resend[0]["to"] == "new@example.com"


def test_register_duplicate_email(client, customer, fake_resend):
    res = client.post("/api/v1/account/register", json={**REG, "email": "ada@example.com"})
    assert res.status_code == 409


def test_login_and_me(client, customer):
    res = client.post(
        "/api/v1/account/login",
        json={"email": "ada@example.com", "password": "customer-pass"},
    )
    assert res.status_code == 200
    assert client.get("/api/v1/account/me").json()["first_name"] == "Ada"


def test_login_bad_password(client, customer):
    res = client.post(
        "/api/v1/account/login",
        json={"email": "ada@example.com", "password": "nope"},
    )
    assert res.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/v1/account/me").status_code == 401


# ── guest-order claiming ─────────────────────────────────────────────────────

def test_login_claims_guest_orders(client, db, customer, make_order):
    order = make_order()  # guest order, customer_email = ada@example.com
    assert order.user_id is None
    client.post(
        "/api/v1/account/login",
        json={"email": "ada@example.com", "password": "customer-pass"},
    )
    db.expire_all()
    assert db.get(Order, order.id).user_id == customer.id


def test_register_claims_prior_guest_orders(client, db, make_order, fake_resend):
    order = make_order()  # ada@example.com guest order
    client.post(
        "/api/v1/account/register",
        json={**REG, "email": "ada@example.com"},
    )
    db.expire_all()
    user = db.scalar(select(User).where(User.email == "ada@example.com"))
    assert db.get(Order, order.id).user_id == user.id


# ── password change / reset ──────────────────────────────────────────────────

def test_password_change_invalidates_old_session(client, customer):
    client.post(
        "/api/v1/account/login",
        json={"email": "ada@example.com", "password": "customer-pass"},
    )
    old_cookie = client.cookies.get(SESSION_COOKIE_CUSTOMER)
    res = client.post(
        "/api/v1/account/password",
        json={"current_password": "customer-pass", "new_password": "a-new-password"},
    )
    assert res.status_code == 200
    assert client.get("/api/v1/account/me").status_code == 200  # re-issued
    client.cookies.set(SESSION_COOKIE_CUSTOMER, old_cookie)
    assert client.get("/api/v1/account/me").status_code == 401


def test_forgot_password_always_202(client, customer, fake_resend):
    assert client.post(
        "/api/v1/account/password/forgot", json={"email": "ada@example.com"}
    ).status_code == 202
    assert client.post(
        "/api/v1/account/password/forgot", json={"email": "ghost@example.com"}
    ).status_code == 202
    assert len(fake_resend) == 1  # only the real address triggered a send


def test_reset_with_valid_token(client, db, customer):
    token = create_link_token(
        str(customer.id), purpose="reset", token_version=0, ttl_minutes=60
    )
    res = client.post(
        "/api/v1/account/password/reset",
        json={"token": token, "new_password": "reset-password-x"},
    )
    assert res.status_code == 200
    # old token now stale (token_version bumped)
    res2 = client.post(
        "/api/v1/account/password/reset",
        json={"token": token, "new_password": "another-one"},
    )
    assert res2.status_code == 400


def test_reset_with_garbage_token(client, customer):
    res = client.post(
        "/api/v1/account/password/reset",
        json={"token": "garbage", "new_password": "whatever-8"},
    )
    assert res.status_code == 400


def test_verify_email(client, db, customer):
    customer.email_verified = False
    db.flush()
    token = create_link_token(
        str(customer.id), purpose="verify", token_version=0, ttl_minutes=60
    )
    res = client.post("/api/v1/account/verify-email", json={"token": token})
    assert res.status_code == 200
    db.expire_all()
    assert db.get(User, customer.id).email_verified is True


# ── order history scoping ────────────────────────────────────────────────────

def test_orders_scoped_to_user(customer_client, db, customer, make_order):
    mine = make_order()
    mine.user_id = customer.id
    other = User(
        email="zoe@example.com", password_hash="x", first_name="Z", last_name="O"
    )
    db.add(other)
    db.flush()
    theirs = make_order()
    theirs.user_id = other.id
    db.flush()

    refs = [o["reference"] for o in customer_client.get("/api/v1/account/orders").json()]
    assert mine.reference in refs
    assert theirs.reference not in refs


def test_order_detail_404_for_others(customer_client, db, customer, make_order):
    other = User(email="z@example.com", password_hash="x", first_name="Z", last_name="O")
    db.add(other)
    db.flush()
    theirs = make_order()
    theirs.user_id = other.id
    db.flush()
    assert customer_client.get(
        f"/api/v1/account/orders/{theirs.reference}"
    ).status_code == 404


# ── POST /orders links the customer ──────────────────────────────────────────

_ORDER_BODY = {
    "contact": {
        "first_name": "Ada", "last_name": "Obi",
        "email": "ada@example.com", "phone": "+2348012345678",
    },
    "delivery": {
        "country_code": "NG", "country_name": "Nigeria", "address_1": "1 Rd",
        "address_2": "", "city": "Lagos", "state_region": "Lagos",
        "postal_code": "", "notes": "",
    },
}


def test_order_links_to_signed_in_customer(customer_client, db, customer, seeded_zones, make_product):
    product = make_product()
    res = customer_client.post(
        "/api/v1/orders",
        json={**_ORDER_BODY, "items": [{"product_id": product.id, "quantity": 1}]},
    )
    assert res.status_code == 201
    order = db.scalar(select(Order).where(Order.reference == res.json()["reference"]))
    assert order.user_id == customer.id


def test_guest_order_has_no_user(client, db, seeded_zones, make_product):
    product = make_product()
    res = client.post(
        "/api/v1/orders",
        json={**_ORDER_BODY, "items": [{"product_id": product.id, "quantity": 1}]},
    )
    assert res.status_code == 201
    order = db.scalar(select(Order).where(Order.reference == res.json()["reference"]))
    assert order.user_id is None


# ── addresses ────────────────────────────────────────────────────────────────

_ADDR = {
    "label": "Home", "country_code": "NG", "country_name": "Nigeria",
    "address_1": "12 Aptech Close", "city": "Lagos", "state_region": "Lagos",
}


def test_address_crud_and_default(customer_client):
    a = customer_client.post("/api/v1/account/addresses", json=_ADDR).json()
    assert a["is_default"] is True  # first is auto-default
    b = customer_client.post(
        "/api/v1/account/addresses", json={**_ADDR, "label": "Work"}
    ).json()
    assert b["is_default"] is False

    customer_client.patch(
        f"/api/v1/account/addresses/{b['id']}",
        json={**_ADDR, "label": "Work", "is_default": True},
    )
    lst = customer_client.get("/api/v1/account/addresses").json()
    defaults = [x for x in lst if x["is_default"]]
    assert len(defaults) == 1 and defaults[0]["id"] == b["id"]

    assert customer_client.delete(
        f"/api/v1/account/addresses/{b['id']}"
    ).status_code == 204


# ── measurements ─────────────────────────────────────────────────────────────

def test_measurements_upsert(customer_client):
    assert customer_client.get("/api/v1/account/measurements").json() is None
    res = customer_client.put(
        "/api/v1/account/measurements",
        json={"bust_cm": 91, "waist_cm": 74, "notes": "prefer a looser sleeve"},
    )
    assert res.status_code == 200
    got = customer_client.get("/api/v1/account/measurements").json()
    assert float(got["bust_cm"]) == 91.0


def test_measurements_reject_absurd_values(customer_client):
    res = customer_client.put(
        "/api/v1/account/measurements", json={"bust_cm": 999}
    )
    assert res.status_code == 422
