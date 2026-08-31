from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Product
from app.schemas.product import PublicProductOut

router = APIRouter()

_with_relations = (selectinload(Product.images), selectinload(Product.category))


@router.get("", response_model=list[PublicProductOut])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    stmt = (
        select(Product)
        .where(Product.is_published.is_(True))
        .options(*_with_relations)
        .order_by(Product.created_at.desc())
    )
    return list(db.scalars(stmt))


@router.get("/{slug}", response_model=PublicProductOut)
def get_product(slug: str, db: Session = Depends(get_db)) -> Product:
    stmt = (
        select(Product)
        .where(Product.slug == slug, Product.is_published.is_(True))
        .options(*_with_relations)
    )
    product = db.scalar(stmt)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
