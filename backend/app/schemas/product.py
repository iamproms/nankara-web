from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Availability
from app.schemas.category import CategoryOut


class ProductImageIn(BaseModel):
    url: str = Field(min_length=1, max_length=1000)
    public_id: str = Field(min_length=1, max_length=500)
    alt_text: str = Field(default="", max_length=300)
    is_primary: bool = False


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    public_id: str
    alt_text: str
    sort_order: int
    is_primary: bool


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    description: str = ""
    price_ngn: int = Field(ge=0)
    category_id: int | None = None
    availability: Availability = Availability.IN_STOCK
    is_published: bool = False
    images: list[ProductImageIn] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    description: str | None = None
    price_ngn: int | None = Field(default=None, ge=0)
    category_id: int | None = None
    availability: Availability | None = None
    is_published: bool | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    price_ngn: int
    availability: Availability
    is_published: bool
    category: CategoryOut | None
    images: list[ProductImageOut]
    primary_image: ProductImageOut | None
    created_at: datetime
    updated_at: datetime


class PublicProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    price_ngn: int
    availability: Availability
    category: CategoryOut | None
    images: list[ProductImageOut]
    primary_image: ProductImageOut | None
