"""Transactional email via Resend (https://resend.com).

Best-effort: if Resend is unconfigured or the call fails, `send_email` logs and
returns False — it never raises into a request handler. Account flows (register,
forgot-password) succeed regardless.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_ENDPOINT = "https://api.resend.com/emails"
_TIMEOUT = 15.0


def send_email(*, to: str, subject: str, html: str) -> bool:
    if not settings.email_configured:
        logger.info("Email not configured — skipping send to %s (%r)", to, subject)
        return False
    try:
        response = httpx.post(
            _ENDPOINT,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.resend_from,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=_TIMEOUT,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.warning("Resend send to %s failed: %s", to, exc)
        return False
