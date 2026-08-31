"""Thin wrapper around the Paystack REST API.

Payment initialisation and verification are the only calls the MVP needs
(spec §13). Configuration comes from the environment; if the secret key is
missing these raise a clear 503 rather than failing obscurely. Sync `httpx`
matches the rest of the codebase (every route is a plain `def`).
"""

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

_TIMEOUT = 20.0


def _ensure_configured() -> None:
    if not settings.paystack_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Paystack is not configured. Set PAYSTACK_SECRET_KEY.",
        )


def _client() -> httpx.Client:
    return httpx.Client(
        base_url=settings.paystack_base_url,
        headers={
            "Authorization": f"Bearer {settings.paystack_secret_key}",
            "Content-Type": "application/json",
        },
        timeout=_TIMEOUT,
    )


def _data(response: httpx.Response) -> dict:
    try:
        response.raise_for_status()
        body = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Paystack request failed: {exc}",
        ) from exc
    if not body.get("status"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Paystack error: {body.get('message', 'unknown')}",
        )
    return body.get("data") or {}


def initialize_transaction(
    *, email: str, amount_kobo: int, reference: str, callback_url: str
) -> dict:
    """Start a transaction. Returns Paystack's `data`
    (`authorization_url`, `access_code`, `reference`).
    """
    _ensure_configured()
    with _client() as client:
        response = client.post(
            "/transaction/initialize",
            json={
                "email": email,
                "amount": amount_kobo,
                "reference": reference,
                "callback_url": callback_url,
                "currency": "NGN",
            },
        )
    return _data(response)


def verify_transaction(reference: str) -> dict:
    """Fetch the authoritative state of a transaction. Returns Paystack's `data`
    (`status`, `amount`, `currency`, ...).
    """
    _ensure_configured()
    with _client() as client:
        response = client.get(f"/transaction/verify/{reference}")
    return _data(response)
