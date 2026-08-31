from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import OrderStatus


def _strip(value: object) -> object:
    return value.strip() if isinstance(value, str) else value


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    phone: str = Field(default="", max_length=40)

    _s = field_validator("first_name", "last_name", "phone", mode="before")(_strip)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateIn(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)

    _s = field_validator("first_name", "last_name", "phone", mode="before")(_strip)


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyIn(BaseModel):
    token: str


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    email_verified: bool
    created_at: datetime


# ── Addresses ────────────────────────────────────────────────────────────────

class AddressIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    is_default: bool = False
    country_code: str = Field(min_length=2, max_length=2)
    country_name: str = Field(min_length=1, max_length=120)
    address_1: str = Field(min_length=1, max_length=255)
    address_2: str = Field(default="", max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state_region: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(default="", max_length=40)
    recipient_phone: str = Field(default="", max_length=40)

    _s = field_validator(
        "label", "country_name", "address_1", "address_2", "city",
        "state_region", "postal_code", "recipient_phone", mode="before",
    )(_strip)

    @field_validator("country_code", mode="before")
    @classmethod
    def _upper(cls, value: object) -> object:
        return value.strip().upper() if isinstance(value, str) else value


class AddressOut(AddressIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


# ── Measurements ─────────────────────────────────────────────────────────────

_M = Field(default=None, ge=20, le=250)


class MeasurementProfileIn(BaseModel):
    bust_cm: float | None = _M
    waist_cm: float | None = _M
    hip_cm: float | None = _M
    shoulder_cm: float | None = _M
    sleeve_length_cm: float | None = _M
    dress_length_cm: float | None = _M
    height_cm: float | None = _M
    notes: str = Field(default="", max_length=2000)


class MeasurementProfileOut(MeasurementProfileIn):
    model_config = ConfigDict(from_attributes=True)

    updated_at: datetime


# ── Order history ────────────────────────────────────────────────────────────

class AccountOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_name: str
    product_slug: str
    unit_price: int
    quantity: int
    subtotal: int


class AccountOrderSummary(BaseModel):
    reference: str
    status: OrderStatus
    total: int
    currency: str
    created_at: datetime


class AccountOrderDetail(AccountOrderSummary):
    subtotal: int
    shipping_amount: int
    items: list[AccountOrderItemOut]
    delivery_city: str
    delivery_state_region: str
    delivery_country: str
    delivery_address_1: str
    delivery_address_2: str
    delivery_postal_code: str
    customer_phone: str
    payment_reference: str | None
