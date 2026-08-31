from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.core.slugs import ensure_unique_slug, slugify_text
from app.models import Category, Product
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(
    dependencies=[Depends(get_current_admin), Depends(require_trusted_origin)]
)


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)))


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    base = slugify_text(payload.slug or payload.name)
    category = Category(name=payload.name, slug=ensure_unique_slug(db, Category, base))
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)
) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        category.name = data["name"]
    if data.get("slug"):
        category.slug = ensure_unique_slug(
            db, Category, slugify_text(data["slug"]), exclude_id=category.id
        )
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    # Products keep their history; the FK is set to NULL on delete.
    db.query(Product).filter(Product.category_id == category_id).update(
        {Product.category_id: None}
    )
    db.delete(category)
    db.commit()
    return None
