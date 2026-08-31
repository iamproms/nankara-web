from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.measurement_profile import MeasurementProfile
    from app.models.order import Order
    from app.models.user_address import UserAddress


class User(Base, TimestampMixin):
    """A customer account (spec §31). Optional for checkout — guest orders keep a
    NULL `user_id`. Orders always store their own contact snapshot regardless.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(
        String(40), default="", server_default="", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )
    # Bumped on password change / reset — invalidates outstanding sessions and
    # reset links (same mechanism as Admin.token_version).
    token_version: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )

    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    addresses: Mapped[list["UserAddress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="UserAddress.id",
    )
    measurement_profile: Mapped["MeasurementProfile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
