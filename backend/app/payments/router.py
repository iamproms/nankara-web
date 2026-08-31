import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.ratelimit import limiter
from app.models import Order
from app.orders.service import to_confirmation
from app.payments.service import (
    OrderNotPayable,
    handle_webhook,
    start_payment,
    verify_and_apply,
)
from app.payments.signature import verify_signature
from app.schemas.order import OrderConfirmationOut
from app.schemas.payment import PaymentInitIn, PaymentInitOut, PaymentVerifyIn

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/paystack/initialize", response_model=PaymentInitOut)
@limiter.limit("10/minute")
def initialize_payment(
    request: Request, payload: PaymentInitIn, db: Session = Depends(get_db)
) -> PaymentInitOut:
    order = db.scalar(select(Order).where(Order.reference == payload.reference))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        payment = start_payment(db, order)
    except OrderNotPayable as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return PaymentInitOut(
        authorization_url=payment.authorization_url or "",
        reference=payment.provider_reference,
    )


@router.post("/paystack/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    raw = await request.body()
    if not verify_signature(raw, request.headers.get("x-paystack-signature")):
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        event = json.loads(raw)
    except ValueError:
        raise HTTPException(status_code=400, detail="Malformed payload")

    handle_webhook(db, event)
    # Always 200 on a valid signature so Paystack stops retrying — duplicate and
    # ignored events are no-ops inside handle_webhook.
    return {"status": "ok"}


@router.post("/paystack/verify", response_model=OrderConfirmationOut)
@limiter.limit("20/minute")
def verify_payment(
    request: Request, payload: PaymentVerifyIn, db: Session = Depends(get_db)
) -> OrderConfirmationOut:
    order = verify_and_apply(db, payload.reference)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    # Reload items for the confirmation view.
    order = db.scalar(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    return to_confirmation(order)
