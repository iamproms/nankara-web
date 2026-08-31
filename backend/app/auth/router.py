from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_admin
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models import Admin
from app.schemas.admin import AdminOut
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
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
    token = create_access_token(str(admin.id))
    return TokenResponse(access_token=token, admin=AdminOut.model_validate(admin))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: Admin = Depends(get_current_admin)) -> None:
    # Stateless JWT: the client discards its token. Endpoint exists for API
    # symmetry and so a future token-blocklist can be added without a contract
    # change.
    return None


@router.get("/me", response_model=AdminOut)
def me(admin: Admin = Depends(get_current_admin)) -> Admin:
    return admin
