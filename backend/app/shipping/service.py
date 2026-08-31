from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ShippingZone
from app.shipping.zones import resolve_zone_code


class ShippingUnavailable(Exception):
    """No active shipping zone covers the given destination."""


@dataclass(frozen=True)
class ShippingQuote:
    zone_id: int
    zone_code: str
    zone_name: str
    amount: int
    currency: str


def quote_shipping(
    db: Session, *, country_code: str, state_region: str | None
) -> ShippingQuote:
    """Authoritative shipping quote for a destination (spec §11, §24).

    Raises ShippingUnavailable if the resolved zone has no active row — e.g. the
    admin disabled it, or the seed is incomplete.
    """
    code = resolve_zone_code(country_code, state_region)
    zone = db.scalar(
        select(ShippingZone).where(
            ShippingZone.code == code, ShippingZone.is_active.is_(True)
        )
    )
    if zone is None:
        raise ShippingUnavailable(
            "We can't ship to that destination yet. Please contact us to arrange delivery."
        )
    return ShippingQuote(
        zone_id=zone.id,
        zone_code=zone.code,
        zone_name=zone.name,
        amount=zone.rate,
        currency=zone.currency,
    )
