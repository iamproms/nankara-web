"""Paystack webhook signature verification (spec §13, §25).

Paystack signs the raw request body with HMAC-SHA512 using the account's
*secret* key and sends the hex digest in the `x-paystack-signature` header.
"""

import hashlib
import hmac

from app.core.config import settings


def verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """True when `signature_header` is a valid HMAC-SHA512 of `raw_body`.

    Returns False (never raises) when the header is missing or Paystack is not
    configured — the caller turns that into a 401.
    """
    if not signature_header or not settings.paystack_secret_key:
        return False
    expected = hmac.new(
        settings.paystack_secret_key.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
