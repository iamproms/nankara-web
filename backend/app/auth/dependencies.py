import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import AUDIENCE_ADMIN, SESSION_COOKIE_ADMIN, decode_token
from app.models import Admin

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "cookie"},
)


def get_current_admin(
    request: Request,
    db: Session = Depends(get_db),
) -> Admin:
    token = request.cookies.get(SESSION_COOKIE_ADMIN)
    if not token:
        raise _credentials_error
    try:
        payload = decode_token(token, audience=AUDIENCE_ADMIN)
    except jwt.PyJWTError as exc:
        raise _credentials_error from exc

    subject = payload.get("sub")
    if subject is None:
        raise _credentials_error

    admin = db.get(Admin, int(subject))
    if admin is None or not admin.is_active:
        raise _credentials_error
    if payload.get("tv") != admin.token_version:
        raise _credentials_error
    return admin
