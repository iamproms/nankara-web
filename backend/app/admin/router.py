from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_admin
from app.core.database import get_db
from app.models import Availability, Category, Product
from app.schemas.admin import OverviewOut

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("/overview", response_model=OverviewOut)
def overview(db: Session = Depends(get_db)) -> OverviewOut:
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    published = (
        db.scalar(
            select(func.count()).select_from(Product).where(Product.is_published.is_(True))
        )
        or 0
    )
    out_of_stock = (
        db.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.availability == Availability.OUT_OF_STOCK)
        )
        or 0
    )
    total_categories = db.scalar(select(func.count()).select_from(Category)) or 0

    return OverviewOut(
        total_products=total_products,
        published_products=published,
        draft_products=total_products - published,
        out_of_stock_products=out_of_stock,
        total_categories=total_categories,
    )
