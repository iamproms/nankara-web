from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.shipping import ShippingQuoteOut, ShippingQuoteRequest
from app.shipping.service import ShippingUnavailable, quote_shipping

router = APIRouter()


@router.post("/quote", response_model=ShippingQuoteOut)
def shipping_quote(
    payload: ShippingQuoteRequest, db: Session = Depends(get_db)
) -> ShippingQuoteOut:
    try:
        quote = quote_shipping(
            db,
            country_code=payload.country_code,
            state_region=payload.state_region,
        )
    except ShippingUnavailable as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return ShippingQuoteOut(
        zone_code=quote.zone_code,
        zone_name=quote.zone_name,
        amount=quote.amount,
        currency=quote.currency,
    )
