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


class PaymentStatus(str, enum.Enum):
    """Lifecycle of a single payment attempt against an order (spec §13, §20)."""

    PENDING = "PENDING"      # transaction initialised, awaiting Paystack
    SUCCESS = "SUCCESS"      # verified charge — the order moves to PAID
    FAILED = "FAILED"        # Paystack reported failure, or the amount didn't match
    ABANDONED = "ABANDONED"  # customer left the hosted page without paying
