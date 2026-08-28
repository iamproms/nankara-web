from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime


class OverviewOut(BaseModel):
    total_products: int
    published_products: int
    draft_products: int
    out_of_stock_products: int
    total_categories: int
