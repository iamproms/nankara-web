"""Same-origin enforcement for cookie-authenticated, state-changing requests.

Session cookies are `SameSite=Lax`, which already blocks the classic cross-site
form-POST CSRF vector. This adds a defence-in-depth check: every non-safe method
must carry an `Origin` (or `Referer`) that matches an allowed frontend origin.
A double-submit CSRF token is the upgrade path if this ever needs strengthening.
"""

from urllib.parse import urlsplit

from fastapi import HTTPException, Request, status

from app.core.config import settings

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


def _origin_allowed(value: str | None) -> bool:
    if not value:
        return False
    parts = urlsplit(value)
    origin = f"{parts.scheme}://{parts.netloc}" if parts.scheme else value
    return origin in settings.cors_origins


def require_trusted_origin(request: Request) -> None:
    if request.method in _SAFE_METHODS:
        return
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    if _origin_allowed(origin) or _origin_allowed(referer):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Request origin is not allowed.",
    )
