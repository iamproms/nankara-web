"""Small operational CLI.

Usage:
    python -m app.cli create-admin --email you@nankara.com --password '...'
    python -m app.cli list-admins
    python -m app.cli seed-categories
    python -m app.cli seed-demo-products
    python -m app.cli seed-shipping-zones
    python -m app.cli seed-demo-orders
"""

import argparse
import getpass
import sys
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.slugs import ensure_unique_slug, slugify_text
from app.models import (
    Admin,
    Availability,
    Category,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentStatus,
    Product,
    ProductImage,
    ShippingZone,
)
from app.orders.reference import generate_reference

DEFAULT_CATEGORIES = ["Dresses", "Two-Piece Sets", "Gowns", "Separates"]

# Dummy shipping rates (whole Naira) — spec §11. MUST be replaced or explicitly
# approved before accepting real customer orders (Milestone 5). Editable in the
# admin dashboard at /admin/shipping.
DEFAULT_SHIPPING_ZONES = [
    ("rivers", "Rivers", "nigeria", 5000),
    ("lagos", "Lagos", "nigeria", 8000),
    ("abuja-fct", "Abuja / FCT", "nigeria", 9000),
    ("other-nigeria", "Other Nigeria", "nigeria", 10000),
    ("west-africa", "West Africa", "international", 25000),
    ("rest-of-africa", "Rest of Africa", "international", 40000),
    ("united-kingdom", "United Kingdom", "international", 55000),
    ("us-canada", "United States / Canada", "international", 60000),
    ("rest-of-world", "Rest of World", "international", 70000),
]


def _pexels(photo_id: int) -> str:
    return (
        f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg"
        "?auto=compress&cs=tinysrgb&w=1200"
    )


# Development-only sample catalogue for exercising the storefront (Milestone 2).
# Images are hosted on Pexels (already allow-listed in the frontend next.config.mjs),
# so no Cloudinary upload is needed. Not for production use.
DEMO_PRODUCTS = [
    {
        "name": "The Bold Statement Queen",
        "category": "Gowns",
        "price_ngn": 295000,
        "availability": Availability.IN_STOCK,
        "description": (
            "A floor-sweeping Ankara gown cut for presence. Structured shoulders, a "
            "sculpted waist and a dramatic sweep of hand-picked prints.\n\n"
            "Made to your measurements. Our team will be in touch after checkout to "
            "collect the details for your fit."
        ),
        "photos": [1926769, 2703181, 1381556],
    },
    {
        "name": "The Power Queen",
        "category": "Two-Piece Sets",
        "price_ngn": 245000,
        "availability": Availability.IN_STOCK,
        "description": (
            "A tailored two-piece set: a sharp cropped jacket over wide-leg trousers, "
            "in a bold geometric Ankara.\n\n"
            "Made to your measurements."
        ),
        "photos": [2043590, 1043474, 1972115],
    },
    {
        "name": "The Soft Elegant Queen",
        "category": "Dresses",
        "price_ngn": 185000,
        "availability": Availability.IN_STOCK,
        "description": (
            "A fluid midi dress with a gentle drape and a soft, romantic print. "
            "Easy to wear, quietly striking.\n\n"
            "Made to your measurements."
        ),
        "photos": [3757055, 991509, 1755428],
    },
    {
        "name": "The Luminous Queen",
        "category": "Gowns",
        "price_ngn": 320000,
        "availability": Availability.IN_STOCK,
        "description": (
            "An evening gown that catches the light: metallic-threaded Ankara, a "
            "high slit and a fitted bodice.\n\n"
            "Made to your measurements."
        ),
        "photos": [1381556, 1926769, 2065195],
    },
    {
        "name": "The Quiet Power Queen",
        "category": "Separates",
        "price_ngn": 165000,
        "availability": Availability.OUT_OF_STOCK,
        "description": (
            "A considered separates piece: a clean wrap top in a muted Ankara, made "
            "to pair with everything you already own.\n\n"
            "Made to your measurements."
        ),
        "photos": [2065195, 2703181],
    },
]


def create_admin(email: str, password: str | None) -> None:
    email = email.strip().lower()
    if password is None:
        password = getpass.getpass("Password: ")
        if password != getpass.getpass("Confirm password: "):
            sys.exit("Passwords do not match.")
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")

    with SessionLocal() as db:
        if db.scalar(select(Admin).where(Admin.email == email)) is not None:
            sys.exit(f"An admin with email {email} already exists.")
        db.add(Admin(email=email, password_hash=hash_password(password)))
        db.commit()
    print(f"Created admin {email}")


def list_admins() -> None:
    with SessionLocal() as db:
        admins = db.scalars(select(Admin).order_by(Admin.created_at)).all()
    if not admins:
        print("No admins yet.")
        return
    for admin in admins:
        state = "active" if admin.is_active else "disabled"
        print(f"[{admin.id}] {admin.email} ({state})")


def seed_categories() -> None:
    with SessionLocal() as db:
        created = 0
        for name in DEFAULT_CATEGORIES:
            if db.scalar(select(Category).where(Category.name == name)) is not None:
                continue
            slug = ensure_unique_slug(db, Category, slugify_text(name))
            db.add(Category(name=name, slug=slug))
            created += 1
        db.commit()
    print(f"Seeded {created} new category/ies." if created else "Categories already seeded.")


def _get_or_create_category(db, name: str) -> Category:
    category = db.scalar(select(Category).where(Category.name == name))
    if category is None:
        category = Category(
            name=name, slug=ensure_unique_slug(db, Category, slugify_text(name))
        )
        db.add(category)
        db.flush()
    return category


def seed_demo_products() -> None:
    """Insert a small development-only sample catalogue. Idempotent by slug."""
    with SessionLocal() as db:
        created = 0
        for entry in DEMO_PRODUCTS:
            slug = slugify_text(entry["name"])
            if db.scalar(select(Product).where(Product.slug == slug)) is not None:
                continue

            category = _get_or_create_category(db, entry["category"])
            product = Product(
                name=entry["name"],
                slug=ensure_unique_slug(db, Product, slug),
                description=entry["description"],
                price_ngn=entry["price_ngn"],
                category_id=category.id,
                availability=entry["availability"],
                is_published=True,
            )
            for index, photo_id in enumerate(entry["photos"]):
                product.images.append(
                    ProductImage(
                        url=_pexels(photo_id),
                        public_id=f"demo/{slug}-{index + 1}",
                        alt_text=f"{entry['name']} — view {index + 1}",
                        sort_order=index,
                        is_primary=(index == 0),
                    )
                )
            db.add(product)
            created += 1
        db.commit()
    print(
        f"Seeded {created} new demo product(s)."
        if created
        else "Demo products already seeded."
    )


def seed_shipping_zones() -> None:
    """Insert the starter shipping zones with dummy rates. Idempotent by code."""
    with SessionLocal() as db:
        created = 0
        for code, name, region_type, rate in DEFAULT_SHIPPING_ZONES:
            if db.scalar(select(ShippingZone).where(ShippingZone.code == code)):
                continue
            db.add(
                ShippingZone(
                    code=code, name=name, region_type=region_type, rate=rate
                )
            )
            created += 1
        db.commit()
    print(
        f"Seeded {created} new shipping zone(s). Rates are DUMMY figures — "
        "replace before launch."
        if created
        else "Shipping zones already seeded."
    )


# Sentinel so the seed is idempotent and easy to spot / clear.
_DEMO_ORDER_EMAIL = "demo-order@nankara.example"

_DEMO_ORDERS = [
    ("Amara", "Bold Statement", OrderStatus.PENDING_PAYMENT, None),
    ("Zainab", "Power Queen", OrderStatus.PAID, PaymentStatus.SUCCESS),
    ("Ngozi", "Soft Elegant", OrderStatus.IN_PRODUCTION, PaymentStatus.SUCCESS),
    ("Folake", "Luminous Queen", OrderStatus.SHIPPED, PaymentStatus.SUCCESS),
]


def seed_demo_orders() -> None:
    """Insert a few orders across statuses so the admin orders UI has content.

    Development-only. Idempotent — clears and re-inserts the sentinel orders.
    """
    with SessionLocal() as db:
        product = db.scalar(select(Product).where(Product.is_published.is_(True)))
        zone = db.scalar(
            select(ShippingZone).where(ShippingZone.is_active.is_(True))
        )
        if product is None or zone is None:
            sys.exit(
                "Need at least one published product and one active shipping zone. "
                "Run seed-demo-products and seed-shipping-zones first."
            )

        existing = db.scalars(
            select(Order).where(Order.customer_email == _DEMO_ORDER_EMAIL)
        ).all()
        for order in existing:
            db.delete(order)
        db.flush()

        for first_name, last_name, status, pay_status in _DEMO_ORDERS:
            subtotal = product.price_ngn
            total = subtotal + zone.rate
            order = Order(
                reference=generate_reference(),
                customer_first_name=first_name,
                customer_last_name=last_name,
                customer_email=_DEMO_ORDER_EMAIL,
                customer_phone="+2348000000000",
                delivery_country="Nigeria",
                delivery_address_1="1 Demo Street",
                delivery_city="Lagos",
                delivery_state_region="Lagos",
                shipping_zone_id=zone.id,
                shipping_zone_name=zone.name,
                shipping_amount=zone.rate,
                subtotal=subtotal,
                total=total,
                currency="NGN",
                status=status,
                items=[
                    OrderItem(
                        product_id=product.id,
                        product_name=product.name,
                        product_slug=product.slug,
                        unit_price=product.price_ngn,
                        quantity=1,
                        subtotal=subtotal,
                    )
                ],
            )
            if pay_status is not None:
                order.payments.append(
                    Payment(
                        provider_reference=f"{order.reference}",
                        amount=total * 100,
                        currency="NGN",
                        status=pay_status,
                        verified_at=datetime.now(timezone.utc),
                    )
                )
            db.add(order)
        db.commit()
    print(f"Seeded {len(_DEMO_ORDERS)} demo orders ({_DEMO_ORDER_EMAIL}).")


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    p_create = sub.add_parser("create-admin", help="Create an admin account")
    p_create.add_argument("--email", required=True)
    p_create.add_argument("--password", help="Prompted for if omitted")

    sub.add_parser("list-admins", help="List admin accounts")
    sub.add_parser("seed-categories", help="Insert a starter set of categories")
    sub.add_parser(
        "seed-demo-products", help="Insert a development-only sample catalogue"
    )
    sub.add_parser(
        "seed-shipping-zones", help="Insert the starter shipping zones (dummy rates)"
    )
    sub.add_parser(
        "seed-demo-orders", help="Insert development-only demo orders across statuses"
    )

    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.password)
    elif args.command == "list-admins":
        list_admins()
    elif args.command == "seed-categories":
        seed_categories()
    elif args.command == "seed-demo-products":
        seed_demo_products()
    elif args.command == "seed-shipping-zones":
        seed_shipping_zones()
    elif args.command == "seed-demo-orders":
        seed_demo_orders()


if __name__ == "__main__":
    main()
