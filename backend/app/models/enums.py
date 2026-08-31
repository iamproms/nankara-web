import enum


class Availability(str, enum.Enum):
    IN_STOCK = "IN_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class OrderStatus(str, enum.Enum):
    """Order lifecycle for Nankara's made-to-measure workflow (spec §15)."""

    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    IN_PRODUCTION = "IN_PRODUCTION"
    READY = "READY"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
