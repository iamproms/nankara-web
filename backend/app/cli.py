"""Small operational CLI.

Usage:
    python -m app.cli create-admin --email you@nankara.com --password '...'
    python -m app.cli list-admins
    python -m app.cli seed-categories
    python -m app.cli seed-demo-products
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.slugs import ensure_unique_slug, slugify_text
from app.models import Admin, Availability, Category, Product, ProductImage

DEFAULT_CATEGORIES = ["Dresses", "Two-Piece Sets", "Gowns", "Separates"]


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

    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.password)
    elif args.command == "list-admins":
        list_admins()
    elif args.command == "seed-categories":
        seed_categories()
    elif args.command == "seed-demo-products":
        seed_demo_products()


if __name__ == "__main__":
    main()
