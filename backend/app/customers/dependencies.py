import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    AUDIENCE_CUSTOMER,
    SESSION_COOKIE_CUSTOMER,
    decode_token,
)
from app.models import User

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "cookie"},
)


def _user_from_cookie(request: Request, db: Session) -> User | None:
    token = request.cookies.get(SESSION_COOKIE_CUSTOMER)
    if not token:
        return None
    try:
        payload = decode_token(token, audience=AUDIENCE_CUSTOMER)
    except jwt.PyJWTError:
        return None
    subject = payload.get("sub")
    if subject is None:
        return None
    user = db.get(User, int(subject))
    if user is None or not user.is_active:
        return None
    if payload.get("tv") != user.token_version:
        return None
    return user


def get_current_customer(
    request: Request, db: Session = Depends(get_db)
) -> User:
    user = _user_from_cookie(request, db)
    if user is None:
        raise _credentials_error
    return user


def get_current_customer_optional(
    request: Request, db: Session = Depends(get_db)
) -> User | None:
    return _user_from_cookie(request, db)
