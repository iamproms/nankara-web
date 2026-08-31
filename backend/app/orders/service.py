from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Availability, Order, OrderItem, OrderStatus, Product
from app.orders.reference import unique_reference
from app.schemas.order import OrderCreate
from app.shipping.service import quote_shipping


class EmptyCartError(Exception):
    """The order has no line items."""


class OrderValidationError(Exception):
    """One or more requested products can't be ordered.

    `problems` is a list of {product_id, reason, product_name?} dicts.
    """

    def __init__(self, problems: list[dict]) -> None:
        super().__init__("Some items are no longer available.")
        self.problems = problems


def _check_products(payload: OrderCreate, products: dict[int, Product]) -> None:
    problems: list[dict] = []
    for item in payload.items:
        product = products.get(item.product_id)
        if product is None or not product.is_published:
            problems.append({"product_id": item.product_id, "reason": "unavailable"})
        elif product.availability != Availability.IN_STOCK:
            problems.append(
                {
                    "product_id": item.product_id,
                    "reason": "out_of_stock",
                    "product_name": product.name,
                }
            )
    if problems:
        raise OrderValidationError(problems)


def create_order(db: Session, payload: OrderCreate) -> Order:
    """Turn a validated cart into a PENDING_PAYMENT order (spec §12, §13).

    Every money value is recomputed here from the database — the payload's job is
    only to say *which* products and *how many* (spec §24).
    """
    if not payload.items:
        raise EmptyCartError()

    ids = [item.product_id for item in payload.items]
    products = {
        product.id: product
        for product in db.scalars(select(Product).where(Product.id.in_(ids)))
    }
    _check_products(payload, products)

    order_items: list[OrderItem] = []
    subtotal = 0
    for item in payload.items:
        product = products[item.product_id]
        line_subtotal = product.price_ngn * item.quantity
        subtotal += line_subtotal
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_slug=product.slug,
                unit_price=product.price_ngn,
                quantity=item.quantity,
                subtotal=line_subtotal,
            )
        )

    quote = quote_shipping(
        db,
        country_code=payload.delivery.country_code,
        state_region=payload.delivery.state_region,
    )
    total = subtotal + quote.amount

    order = Order(
        reference=unique_reference(db),
        customer_first_name=payload.contact.first_name,
        customer_last_name=payload.contact.last_name,
        customer_email=str(payload.contact.email),
        customer_phone=payload.contact.phone,
        delivery_country=payload.delivery.country_name,
        delivery_address_1=payload.delivery.address_1,
        delivery_address_2=payload.delivery.address_2,
        delivery_city=payload.delivery.city,
        delivery_state_region=payload.delivery.state_region,
        delivery_postal_code=payload.delivery.postal_code,
        delivery_notes=payload.delivery.notes,
        shipping_zone_id=quote.zone_id,
        shipping_zone_name=quote.zone_name,
        shipping_amount=quote.amount,
        subtotal=subtotal,
        total=total,
        currency=quote.currency,
        status=OrderStatus.PENDING_PAYMENT,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
