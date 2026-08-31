from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderStatus, PaymentStatus
from app.schemas.order import OrderItemOut


class AdminPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    provider_reference: str
    amount: int  # kobo
    currency: str
    status: PaymentStatus
    verified_at: datetime | None


class AdminOrderListItem(BaseModel):
    id: int
    reference: str
    customer_name: str
    customer_email: str
    total: int
    currency: str
    status: OrderStatus
    payment_status: PaymentStatus | None
    delivery_city: str
    delivery_country: str
    created_at: datetime


class AdminOrderCustomer(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str


class AdminOrderDelivery(BaseModel):
    country: str
    address_1: str
    address_2: str
    city: str
    state_region: str
    postal_code: str
    notes: str


class AdminOrderShipping(BaseModel):
    zone_name: str
    amount: int


class AdminOrderAccount(BaseModel):
    id: int
    email: str
    email_verified: bool


class AdminOrderDetailOut(BaseModel):
    id: int
    reference: str
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    customer: AdminOrderCustomer
    delivery: AdminOrderDelivery
    shipping: AdminOrderShipping
    subtotal: int
    total: int
    currency: str
    items: list[OrderItemOut]
    payment: AdminPaymentOut | None
    account: AdminOrderAccount | None


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus
