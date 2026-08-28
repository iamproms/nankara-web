"""Small operational CLI.

Usage:
    python -m app.cli create-admin --email you@nankara.com --password '...'
    python -m app.cli list-admins
    python -m app.cli seed-categories
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.slugs import ensure_unique_slug, slugify_text
from app.models import Admin, Category

DEFAULT_CATEGORIES = ["Dresses", "Two-Piece Sets", "Gowns", "Separates"]


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


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    p_create = sub.add_parser("create-admin", help="Create an admin account")
    p_create.add_argument("--email", required=True)
    p_create.add_argument("--password", help="Prompted for if omitted")

    sub.add_parser("list-admins", help="List admin accounts")
    sub.add_parser("seed-categories", help="Insert a starter set of categories")

    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.password)
    elif args.command == "list-admins":
        list_admins()
    elif args.command == "seed-categories":
        seed_categories()


if __name__ == "__main__":
    main()
