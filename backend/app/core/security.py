from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Response

from app.core.config import settings

ALGORITHM = "HS256"
ISSUER = "nankara"

# Token audiences. A token minted for one audience is rejected on the others.
AUDIENCE_ADMIN = "nankara-admin"
AUDIENCE_CUSTOMER = "nankara-customer"

# Session cookie names — one per audience so admin and customer sessions are
# independent (an admin browsing the storefront doesn't disturb their admin login).
SESSION_COOKIE_ADMIN = "nk_admin"
SESSION_COOKIE_CUSTOMER = "nk_customer"

# bcrypt rejects inputs longer than 72 bytes; truncation is the standard workaround.
_MAX_PW_BYTES = 72


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_MAX_PW_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8")[:_MAX_PW_BYTES],
            password_hash.encode("utf-8"),
        )
    except ValueError:
        return False


def create_token(
    subject: str, *, audience: str, token_version: int, ttl_minutes: int
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "aud": audience,
        "iss": ISSUER,
        "tv": token_version,
        "iat": now,
        "exp": now + timedelta(minutes=ttl_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str, *, audience: str) -> dict:
    """Decode + verify signature, expiry, issuer and audience. Raises jwt.PyJWTError."""
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[ALGORITHM],
        audience=audience,
        issuer=ISSUER,
    )


# ── Single-use link tokens (email verification, password reset) ───────────────

def _link_audience(purpose: str) -> str:
    return f"nankara-{purpose}"


def create_link_token(
    subject: str, *, purpose: str, token_version: int, ttl_minutes: int
) -> str:
    return create_token(
        subject,
        audience=_link_audience(purpose),
        token_version=token_version,
        ttl_minutes=ttl_minutes,
    )


def decode_link_token(token: str, *, purpose: str) -> dict:
    return decode_token(token, audience=_link_audience(purpose))


# ── Session cookies ──────────────────────────────────────────────────────────

def set_session_cookie(
    response: Response, name: str, token: str, *, ttl_minutes: int
) -> None:
    response.set_cookie(
        key=name,
        value=token,
        max_age=ttl_minutes * 60,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
        domain=settings.cookie_domain or None,
    )


def clear_session_cookie(response: Response, name: str) -> None:
    response.delete_cookie(
        key=name, path="/", samesite="lax", domain=settings.cookie_domain or None
    )
