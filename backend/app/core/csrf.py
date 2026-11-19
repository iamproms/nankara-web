"""Same-origin enforcement for cookie-authenticated, state-changing requests.

Session cookies are `SameSite=Lax`, which already blocks the classic cross-site
form-POST CSRF vector. This adds defence-in-depth: on a non-safe method, if an
`Origin` (or `Referer`) header is present it MUST match an allowed frontend
origin. Requests with no `Origin`/`Referer` at all (curl, server-to-server, API
tooling) are allowed — a browser always sends `Origin` on a state-changing
cross-origin request, so the CSRF vector is still covered. A double-submit CSRF
token is the upgrade path if this ever needs strengthening.
"""

from urllib.parse import urlsplit

from fastapi import HTTPException, Request, status

from app.core.config import settings

_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


def _origin_of(value: str | None) -> str | None:
    if not value:
        return None
    parts = urlsplit(value)
    if not parts.scheme:
        return None
    return f"{parts.scheme}://{parts.netloc}"


def require_trusted_origin(request: Request) -> None:
    if request.method in _SAFE_METHODS:
        return
    origin = _origin_of(request.headers.get("origin")) or _origin_of(
        request.headers.get("referer")
    )
    if origin is None:
        return  # no browser origin → not a browser CSRF vector
    if origin in settings.cors_origins:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Request origin is not allowed.",
    )
