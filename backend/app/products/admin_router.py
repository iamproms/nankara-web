import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.config import settings
from app.core.database import get_db
from app.core.slugs import ensure_unique_slug, slugify_text
from app.media.cloudinary_client import delete_image
from app.models import Category, Product
from app.products.images import apply_images
from app.schemas.product import (
    ProductCreate,
    ProductImageIn,
    ProductOut,
    ProductUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    dependencies=[Depends(get_current_admin), Depends(require_trusted_origin)]
)

_with_relations = (selectinload(Product.images), selectinload(Product.category))


def _get_or_404(db: Session, product_id: int) -> Product:
    stmt = select(Product).where(Product.id == product_id).options(*_with_relations)
    product = db.scalar(stmt)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _validate_category(db: Session, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(status_code=422, detail="Category does not exist")


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    stmt = select(Product).options(*_with_relations).order_by(Product.created_at.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    _validate_category(db, payload.category_id)
    base_slug = slugify_text(payload.slug or payload.name)

    product = Product(
        name=payload.name,
        slug=ensure_unique_slug(db, Product, base_slug),
        description=payload.description or "",
        price_ngn=payload.price_ngn,
        category_id=payload.category_id,
        availability=payload.availability,
        is_published=payload.is_published,
    )
    apply_images(product, payload.images)

    db.add(product)
    db.commit()
    db.refresh(product)
    return _get_or_404(db, product.id)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    return _get_or_404(db, product_id)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
) -> Product:
    product = _get_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data:
        _validate_category(db, data["category_id"])

    # Slug only changes when explicitly supplied — renaming a product must not
    # silently break an existing shareable URL.
    if data.get("slug"):
        product.slug = ensure_unique_slug(
            db, Product, slugify_text(data["slug"]), exclude_id=product.id
        )

    for field in (
        "name",
        "description",
        "price_ngn",
        "category_id",
        "availability",
        "is_published",
    ):
        if field in data:
            setattr(product, field, data[field])

    db.commit()
    return _get_or_404(db, product.id)


@router.put("/{product_id}/images", response_model=ProductOut)
def replace_images(
    product_id: int,
    images: list[ProductImageIn],
    db: Session = Depends(get_db),
) -> Product:
    product = _get_or_404(db, product_id)

    previous_public_ids = {image.public_id for image in product.images}
    next_public_ids = {image.public_id for image in images}

    apply_images(product, images)
    db.commit()

    # Best-effort cleanup of images no longer referenced by any product.
    if settings.cloudinary_configured:
        for public_id in previous_public_ids - next_public_ids:
            try:
                delete_image(public_id)
            except Exception:  # noqa: BLE001 - cleanup must not fail the request
                logger.warning("Failed to delete Cloudinary asset %s", public_id)

    return _get_or_404(db, product.id)
