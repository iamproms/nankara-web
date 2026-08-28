from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session


def slugify_text(text: str) -> str:
    return slugify(text) or "item"


def ensure_unique_slug(
    db: Session, model: type, base_slug: str, exclude_id: int | None = None
) -> str:
    """Return base_slug, or base_slug-2 / -3 / ... if it is already taken."""
    slug = base_slug
    suffix = 2
    while True:
        stmt = select(model).where(model.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if db.scalar(stmt) is None:
            return slug
        slug = f"{base_slug}-{suffix}"
        suffix += 1
