from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.models import Order, OrderStatus, Payment, PaymentStatus
from app.orders.service import IllegalStatusTransition, transition_order_status
from app.schemas.admin_order import (
    AdminOrderAccount,
    AdminOrderCustomer,
    AdminOrderDelivery,
    AdminOrderDetailOut,
    AdminOrderListItem,
    AdminOrderShipping,
    AdminOrderStatusUpdate,
    AdminPaymentOut,
)
from app.schemas.order import OrderItemOut

router = APIRouter(
    dependencies=[Depends(get_current_admin), Depends(require_trusted_origin)]
)

_with_relations = (
    selectinload(Order.items),
    selectinload(Order.payments),
    selectinload(Order.user),
)


def _latest_payment(order: Order) -> Payment | None:
    return order.payments[-1] if order.payments else None


def _list_item(order: Order) -> AdminOrderListItem:
    payment = _latest_payment(order)
    return AdminOrderListItem(
        id=order.id,
        reference=order.reference,
        customer_name=f"{order.customer_first_name} {order.customer_last_name}".strip(),
        customer_email=order.customer_email,
        total=order.total,
        currency=order.currency,
        status=order.status,
        payment_status=payment.status if payment else None,
        delivery_city=order.delivery_city,
        delivery_country=order.delivery_country,
        created_at=order.created_at,
    )


def _detail(order: Order) -> AdminOrderDetailOut:
    payment = _latest_payment(order)
    return AdminOrderDetailOut(
        id=order.id,
        reference=order.reference,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=AdminOrderCustomer(
            first_name=order.customer_first_name,
            last_name=order.customer_last_name,
            email=order.customer_email,
            phone=order.customer_phone,
        ),
        delivery=AdminOrderDelivery(
            country=order.delivery_country,
            address_1=order.delivery_address_1,
            address_2=order.delivery_address_2,
            city=order.delivery_city,
            state_region=order.delivery_state_region,
            postal_code=order.delivery_postal_code,
            notes=order.delivery_notes,
        ),
        shipping=AdminOrderShipping(
            zone_name=order.shipping_zone_name, amount=order.shipping_amount
        ),
        subtotal=order.subtotal,
        total=order.total,
        currency=order.currency,
        items=[OrderItemOut.model_validate(item) for item in order.items],
        payment=AdminPaymentOut.model_validate(payment) if payment else None,
        account=(
            AdminOrderAccount(
                id=order.user.id,
                email=order.user.email,
                email_verified=order.user.email_verified,
            )
            if order.user is not None
            else None
        ),
    )


def _get_or_404(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order).where(Order.id == order_id).options(*_with_relations)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("", response_model=list[AdminOrderListItem])
def list_orders(
    db: Session = Depends(get_db),
    order_status: OrderStatus | None = Query(default=None, alias="status"),
    payment: PaymentStatus | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[AdminOrderListItem]:
    stmt = (
        select(Order)
        .options(*_with_relations)
        .order_by(Order.created_at.desc(), Order.id.desc())
    )
    if order_status is not None:
        stmt = stmt.where(Order.status == order_status)
    stmt = stmt.limit(limit)

    orders = list(db.scalars(stmt))
    items = [_list_item(order) for order in orders]
    if payment is not None:
        items = [i for i in items if i.payment_status == payment]
    return items


@router.get("/{order_id}", response_model=AdminOrderDetailOut)
def get_order(order_id: int, db: Session = Depends(get_db)) -> AdminOrderDetailOut:
    return _detail(_get_or_404(db, order_id))


@router.patch("/{order_id}/status", response_model=AdminOrderDetailOut)
def update_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdate,
    db: Session = Depends(get_db),
) -> AdminOrderDetailOut:
    order = _get_or_404(db, order_id)
    try:
        transition_order_status(db, order, payload.status)
    except IllegalStatusTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return _detail(_get_or_404(db, order_id))
