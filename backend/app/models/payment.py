from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PaymentStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.order import Order


class Payment(Base, TimestampMixin):
    """One payment attempt against an order (spec §13, §20).

    Payment-provider details are kept here rather than on `orders` so another
    gateway can be added later without reshaping the order (spec §31). `amount` is
    stored in the currency's smallest unit (kobo for NGN) — that is what Paystack
    transacts in and what the webhook re-checks.
    """

    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_payments_amount_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )

    provider: Mapped[str] = mapped_column(
        String(20), default="paystack", server_default="paystack", nullable=False
    )
    # The reference we hand to Paystack; doubles as our idempotency key.
    provider_reference: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    access_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    authorization_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Smallest currency unit (kobo). order.total (whole Naira) * 100.
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), default="NGN", server_default="NGN", nullable=False
    )

    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(
            PaymentStatus,
            name="payment_status",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=PaymentStatus.PENDING,
        server_default=PaymentStatus.PENDING.value,
        nullable=False,
    )

    # Last webhook / verify payload, for audit and debugging.
    raw_event: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    order: Mapped["Order"] = relationship(back_populates="payments")
