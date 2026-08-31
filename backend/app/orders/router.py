from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models import Order
from app.orders.service import (
    EmptyCartError,
    OrderValidationError,
    create_order,
)
from app.schemas.order import (
    OrderConfirmationOut,
    OrderCreate,
    OrderCustomerSummary,
    OrderDeliverySummary,
    OrderItemOut,
)
from app.shipping.service import ShippingUnavailable

router = APIRouter()


def _to_confirmation(order: Order) -> OrderConfirmationOut:
    return OrderConfirmationOut(
        reference=order.reference,
        status=order.status,
        currency=order.currency,
        subtotal=order.subtotal,
        shipping_amount=order.shipping_amount,
        total=order.total,
        items=[OrderItemOut.model_validate(item) for item in order.items],
        delivery=OrderDeliverySummary(
            city=order.delivery_city,
            state_region=order.delivery_state_region,
            country=order.delivery_country,
        ),
        customer=OrderCustomerSummary(
            first_name=order.customer_first_name,
            email=order.customer_email,
        ),
    )


@router.post(
    "", response_model=OrderConfirmationOut, status_code=status.HTTP_201_CREATED
)
def place_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderConfirmationOut:
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
def order_confirmation(
    reference: str, db: Session = Depends(get_db)
) -> OrderConfirmationOut:
    order = db.scalar(
        select(Order)
        .where(Order.reference == reference)
        .options(selectinload(Order.items))
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_confirmation(order)
