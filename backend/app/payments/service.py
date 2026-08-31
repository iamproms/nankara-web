"""Payment orchestration (spec §13).

The browser is never trusted for money: `start_payment` derives the amount from
`order.total`, and `apply_successful_charge` — the single place an order becomes
PAID — re-checks the amount and currency against what we recorded, and is
idempotent on `provider_reference` so a duplicate webhook can't double-count.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Order, OrderStatus, Payment, PaymentStatus
from app.payments import paystack_client

logger = logging.getLogger(__name__)


class OrderNotPayable(Exception):
    """The order isn't awaiting payment (already paid, cancelled, ...)."""


def _payment_reference(db: Session, order: Order) -> str:
    """A Paystack transaction reference unique to this attempt.

    First attempt reuses the order reference; a retry after a spent attempt gets
    a ``-2`` / ``-3`` suffix (Paystack rejects a reused reference).
    """
    used = {
        row
        for row in db.scalars(
            select(Payment.provider_reference).where(Payment.order_id == order.id)
        )
    }
    if order.reference not in used:
        return order.reference
    suffix = 2
    while f"{order.reference}-{suffix}" in used:
        suffix += 1
    return f"{order.reference}-{suffix}"


def start_payment(db: Session, order: Order) -> Payment:
    """Create a PENDING payment and initialise the Paystack transaction."""
    if order.status != OrderStatus.PENDING_PAYMENT:
        raise OrderNotPayable(
            f"Order {order.reference} is {order.status.value.lower().replace('_', ' ')}."
        )

    reference = _payment_reference(db, order)
    payment = Payment(
        order_id=order.id,
        provider="paystack",
        provider_reference=reference,
        amount=order.total * 100,  # kobo
        currency=order.currency,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.flush()

    callback_url = f"{settings.frontend_origin}/order/{order.reference}/success"
    data = paystack_client.initialize_transaction(
        email=order.customer_email,
        amount_kobo=payment.amount,
        reference=reference,
        callback_url=callback_url,
    )
    payment.access_code = data.get("access_code")
    payment.authorization_url = data.get("authorization_url")
    db.commit()
    db.refresh(payment)
    return payment


def apply_successful_charge(
    db: Session,
    *,
    reference: str,
    event_amount: int,
    event_currency: str,
    raw: dict,
) -> bool:
    """Idempotently record a successful charge and move the order to PAID.

    Returns True when the payment is (now or already) SUCCESS, False otherwise
    (unknown reference, or amount/currency mismatch).
    """
    payment = db.scalar(
        select(Payment).where(Payment.provider_reference == reference)
    )
    if payment is None:
        logger.warning("Paystack charge for unknown reference %s", reference)
        return False
    if payment.status == PaymentStatus.SUCCESS:
        return True

    if (
        event_amount != payment.amount
        or event_currency.upper() != payment.currency.upper()
    ):
        logger.error(
            "Paystack amount/currency mismatch for %s: got %s %s, expected %s %s",
            reference,
            event_amount,
            event_currency,
            payment.amount,
            payment.currency,
        )
        payment.status = PaymentStatus.FAILED
        payment.raw_event = raw
        db.commit()
        return False

    payment.status = PaymentStatus.SUCCESS
    payment.verified_at = datetime.now(timezone.utc)
    payment.raw_event = raw

    order = db.get(Order, payment.order_id)
    if order is not None and order.status == OrderStatus.PENDING_PAYMENT:
        order.status = OrderStatus.PAID
    db.commit()
    return True


def handle_webhook(db: Session, event: dict) -> None:
    """Dispatch a verified Paystack webhook event. Only `charge.success` acts."""
    if event.get("event") != "charge.success":
        return
    data = event.get("data") or {}
    apply_successful_charge(
        db,
        reference=data.get("reference", ""),
        event_amount=data.get("amount", 0),
        event_currency=data.get("currency", "NGN"),
        raw=event,
    )


def verify_and_apply(db: Session, order_reference: str) -> Order | None:
    """On-demand verification against Paystack — the fallback when a webhook
    hasn't arrived (e.g. local dev). Runs the same idempotent transition.

    Keyed on the public *order* reference; verifies the order's latest payment
    attempt. Returns the (refreshed) order, or None if the order is unknown.
    """
    order = db.scalar(select(Order).where(Order.reference == order_reference))
    if order is None:
        return None

    payment = db.scalar(
        select(Payment)
        .where(Payment.order_id == order.id)
        .order_by(Payment.id.desc())
        .limit(1)
    )
    if payment is None:
        return order  # no payment started yet — nothing to verify

    if payment.status != PaymentStatus.SUCCESS:
        data = paystack_client.verify_transaction(payment.provider_reference)
        if data.get("status") == "success":
            apply_successful_charge(
                db,
                reference=payment.provider_reference,
                event_amount=data.get("amount", 0),
                event_currency=data.get("currency", "NGN"),
                raw=data,
            )
        elif payment.status == PaymentStatus.PENDING and data.get("status") in {
            "failed",
            "abandoned",
            "reversed",
        }:
            payment.status = (
                PaymentStatus.ABANDONED
                if data.get("status") == "abandoned"
                else PaymentStatus.FAILED
            )
            payment.raw_event = data
            db.commit()

    db.refresh(order)
    return order
