from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class UserAddress(Base, TimestampMixin):
    """A saved delivery address in a customer's address book. Mirrors the
    `DeliveryIn` checkout shape so it can pre-fill the form.
    """

    __tablename__ = "user_addresses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    is_default: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )

    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    country_name: Mapped[str] = mapped_column(String(120), nullable=False)
    address_1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_2: Mapped[str] = mapped_column(
        String(255), default="", server_default="", nullable=False
    )
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state_region: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str] = mapped_column(
        String(40), default="", server_default="", nullable=False
    )
    recipient_phone: Mapped[str] = mapped_column(
        String(40), default="", server_default="", nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="addresses")
