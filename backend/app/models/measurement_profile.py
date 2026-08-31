from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User

# The measurements a tailor needs for a made-to-measure Ankara piece (cm).
MEASUREMENT_FIELDS = (
    "bust_cm",
    "waist_cm",
    "hip_cm",
    "shoulder_cm",
    "sleeve_length_cm",
    "dress_length_cm",
    "height_cm",
)


class MeasurementProfile(Base, TimestampMixin):
    """One saved measurement set per customer (spec §31). Shared once, used for
    every future made-to-measure order. Collection into the fulfilment workflow
    stays manual for now.
    """

    __tablename__ = "measurement_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    bust_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    waist_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    hip_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    shoulder_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    sleeve_length_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    dress_length_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    notes: Mapped[str] = mapped_column(
        Text, default="", server_default="", nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="measurement_profile")
