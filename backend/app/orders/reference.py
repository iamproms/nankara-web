import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Order

# Crockford base32 without I, L, O, U — unambiguous when read aloud or typed.
_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_PREFIX = "NK-"
_BODY_LEN = 12  # ~60 bits of entropy; the reference is also the public access token


def generate_reference() -> str:
    body = "".join(secrets.choice(_ALPHABET) for _ in range(_BODY_LEN))
    return f"{_PREFIX}{body}"


def unique_reference(db: Session) -> str:
    """A reference not already used by an order. Unguessable — it doubles as the
    public access token for the confirmation endpoint (spec §22).
    """
    while True:
        candidate = generate_reference()
        if db.scalar(select(Order.id).where(Order.reference == candidate)) is None:
            return candidate
