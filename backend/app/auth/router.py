from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.core.ratelimit import limiter
from app.core.security import (
    AUDIENCE_ADMIN,
    SESSION_COOKIE_ADMIN,
    clear_session_cookie,
    create_token,
    hash_password,
    set_session_cookie,
    verify_password,
)
from app.core.config import settings
from app.models import Admin
from app.schemas.admin import AdminOut
from app.schemas.auth import LoginRequest, PasswordChangeRequest

router = APIRouter()

_MIN_PASSWORD_LEN = 8


def _issue_session(response: Response, admin: Admin) -> None:
    token = create_token(
        str(admin.id),
        audience=AUDIENCE_ADMIN,
        token_version=admin.token_version,
        ttl_minutes=settings.admin_token_ttl_minutes,
    )
    set_session_cookie(
        response,
        SESSION_COOKIE_ADMIN,
        token,
        ttl_minutes=settings.admin_token_ttl_minutes,
    )


@router.post("/login", response_model=AdminOut)
@limiter.limit("5/minute")
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> Admin:
    admin = db.scalar(select(Admin).where(Admin.email == payload.email.lower()))
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled"
        )
    _issue_session(response, admin)
    return admin


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_trusted_origin)],
)
def logout(response: Response) -> None:
    clear_session_cookie(response, SESSION_COOKIE_ADMIN)
    return None


@router.get("/me", response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)) -> Admin:
    return admin


@router.post(
    "/password",
    response_model=AdminOut,
    dependencies=[Depends(require_trusted_origin)],
)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    payload: PasswordChangeRequest,
    response: Response,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Admin:
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    if len(payload.new_password) < _MIN_PASSWORD_LEN:
        raise HTTPException(
            status_code=422,
            detail=f"New password must be at least {_MIN_PASSWORD_LEN} characters.",
        )
    admin.password_hash = hash_password(payload.new_password)
    admin.token_version += 1  # invalidates every other session
    db.commit()
    db.refresh(admin)
    _issue_session(response, admin)  # keep this session alive
    return admin
