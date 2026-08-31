import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import Admin

bearer_scheme = HTTPBearer(auto_error=True)

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise _credentials_error from exc

    subject = payload.get("sub")
    if subject is None or payload.get("type") != "admin":
        raise _credentials_error

    admin = db.get(Admin, int(subject))
    if admin is None or not admin.is_active:
        raise _credentials_error
    return admin
