from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.ratelimit import limiter
from app.models import Order
from app.orders.service import (
    EmptyCartError,
    OrderValidationError,
    create_order,
    to_confirmation as _to_confirmation,
)
from app.schemas.order import OrderConfirmationOut, OrderCreate
from app.shipping.service import ShippingUnavailable

router = APIRouter()


@router.post(
    "", response_model=OrderConfirmationOut, status_code=status.HTTP_201_CREATED
)
@limiter.limit("10/minute")
def place_order(
    request: Request, payload: OrderCreate, db: Session = Depends(get_db)
) -> OrderConfirmationOut:
    try:
        order = create_order(db, payload)
    except EmptyCartError:
        raise HTTPException(status_code=422, detail="Your bag is empty.")
    except ShippingUnavailable as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except OrderValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": str(exc), "items": exc.problems},
        )
    return _to_confirmation(order)


@router.get("/{reference}/confirmation", response_model=OrderConfirmationOut)
@limiter.limit("30/minute")
def order_confirmation(
    request: Request, reference: str, db: Session = Depends(get_db)
) -> OrderConfirmationOut:
    order = db.scalar(
        select(Order)
        .where(Order.reference == reference)
        .options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_confirmation(order)
