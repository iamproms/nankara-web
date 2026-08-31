from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.models import ShippingZone
from app.schemas.shipping import ShippingZoneOut, ShippingZoneUpdate

router = APIRouter(
    dependencies=[Depends(get_current_admin), Depends(require_trusted_origin)]
)


@router.get("", response_model=list[ShippingZoneOut])
def list_shipping_zones(db: Session = Depends(get_db)) -> list[ShippingZone]:
    stmt = select(ShippingZone).order_by(
        ShippingZone.region_type, ShippingZone.rate, ShippingZone.name
    )
    return list(db.scalars(stmt))


@router.patch("/{zone_id}", response_model=ShippingZoneOut)
def update_shipping_zone(
    zone_id: int, payload: ShippingZoneUpdate, db: Session = Depends(get_db)
) -> ShippingZone:
    zone = db.get(ShippingZone, zone_id)
    if zone is None:
        raise HTTPException(status_code=404, detail="Shipping zone not found")

    data = payload.model_dump(exclude_unset=True)
    if "rate" in data:
        zone.rate = data["rate"]
    if "is_active" in data:
        zone.is_active = data["is_active"]
    db.commit()
    db.refresh(zone)
    return zone
