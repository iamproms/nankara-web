from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OrderStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.order_item import OrderItem


class Order(Base, TimestampMixin):
    """A guest order. Created as PENDING_PAYMENT before payment is initialised
    (spec §12). Money fields are recalculated server-side, never trusted from the
    browser (spec §24).
    """

    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_orders_subtotal_non_negative"),
        CheckConstraint(
            "shipping_amount >= 0", name="ck_orders_shipping_amount_non_negative"
        ),
        CheckConstraint("total >= 0", name="ck_orders_total_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    # Nullable, reserved for future customer accounts (spec §31). No FK yet — the
    # users table does not exist; a later migration adds the constraint.
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    customer_first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(40), nullable=False)

    delivery_country: Mapped[str] = mapped_column(String(120), nullable=False)
    delivery_address_1: Mapped[str] = mapped_column(String(255), nullable=False)
    delivery_address_2: Mapped[str] = mapped_column(
        String(255), default="", server_default="", nullable=False
    )
    delivery_city: Mapped[str] = mapped_column(String(120), nullable=False)
    delivery_state_region: Mapped[str] = mapped_column(String(120), nullable=False)
    delivery_postal_code: Mapped[str] = mapped_column(
        String(40), default="", server_default="", nullable=False
    )
    delivery_notes: Mapped[str] = mapped_column(
        Text, default="", server_default="", nullable=False
    )

    shipping_zone_id: Mapped[int | None] = mapped_column(
        ForeignKey("shipping_zones.id", ondelete="SET NULL"), index=True, nullable=True
    )
    shipping_zone_name: Mapped[str] = mapped_column(String(120), nullable=False)
    shipping_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), default="NGN", server_default="NGN", nullable=False
    )

    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(
            OrderStatus,
            name="order_status",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=OrderStatus.PENDING_PAYMENT,
        server_default=OrderStatus.PENDING_PAYMENT.value,
        nullable=False,
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id",
    )
