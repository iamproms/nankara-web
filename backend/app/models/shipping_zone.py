from sqlalchemy import Boolean, CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin


class ShippingZone(Base, TimestampMixin):
    """A destination bucket with a configurable flat rate (spec §11).

    Rates are dummy figures until real ones are supplied; the admin can edit them
    via /api/v1/admin/shipping-zones. `code` is the stable key the shipping
    resolver maps a (country, state) pair to.
    """

    __tablename__ = "shipping_zones"
    __table_args__ = (
        CheckConstraint("rate >= 0", name="ck_shipping_zones_rate_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # "nigeria" | "international" — grouping only, not used for gating logic.
    region_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Flat rate, whole Naira (see NANKARA_SHOP_MVP.md §9, §11).
    rate: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), default="NGN", server_default="NGN", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
