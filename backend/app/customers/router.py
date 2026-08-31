import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.core.ratelimit import limiter
from app.core.security import (
    AUDIENCE_CUSTOMER,
    SESSION_COOKIE_CUSTOMER,
    clear_session_cookie,
    create_token,
    decode_link_token,
    set_session_cookie,
)
from app.customers import emails, service
from app.customers.dependencies import get_current_customer
from app.customers.service import (
    AccountDisabled,
    BadCredentials,
    EmailTaken,
)
from app.models import Order, PaymentStatus, User
from app.schemas.account import (
    AccountOrderDetail,
    AccountOrderItemOut,
    AccountOrderSummary,
    AddressIn,
    AddressOut,
    CustomerOut,
    ForgotIn,
    LoginIn,
    MeasurementProfileIn,
    MeasurementProfileOut,
    PasswordChangeIn,
    ProfileUpdateIn,
    RegisterIn,
    ResetIn,
    VerifyIn,
)

router = APIRouter(dependencies=[Depends(require_trusted_origin)])


def _issue_session(response: Response, user: User) -> None:
    token = create_token(
        str(user.id),
        audience=AUDIENCE_CUSTOMER,
        token_version=user.token_version,
        ttl_minutes=settings.customer_token_ttl_minutes,
    )
    set_session_cookie(
        response,
        SESSION_COOKIE_CUSTOMER,
        token,
        ttl_minutes=settings.customer_token_ttl_minutes,
    )


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=CustomerOut, status_code=201)
@limiter.limit("5/minute")
def register(
    request: Request,
    payload: RegisterIn,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    try:
        user = service.register(db, payload)
    except EmailTaken:
        raise HTTPException(status_code=409, detail="That email already has an account.")
    _issue_session(response, user)
    emails.send_verification_email(user)
    return user


@router.post("/login", response_model=CustomerOut)
@limiter.limit("5/minute")
def login(
    request: Request,
    payload: LoginIn,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    try:
        user = service.authenticate(db, payload.email, payload.password)
    except BadCredentials:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except AccountDisabled:
        raise HTTPException(status_code=403, detail="Account is disabled")
    _issue_session(response, user)
    return user


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    clear_session_cookie(response, SESSION_COOKIE_CUSTOMER)
    return None


@router.get("/me", response_model=CustomerOut)
def me(user: User = Depends(get_current_customer)) -> User:
    return user


@router.patch("/me", response_model=CustomerOut)
def update_me(
    payload: ProfileUpdateIn,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> User:
    return service.update_profile(db, user, payload)


@router.post("/password", response_model=CustomerOut)
@limiter.limit("5/minute")
def change_password(
    request: Request,
    payload: PasswordChangeIn,
    response: Response,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> User:
    try:
        user = service.change_password(
            db, user, payload.current_password, payload.new_password
        )
    except BadCredentials:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    _issue_session(response, user)
    return user


@router.post("/password/forgot", status_code=202)
@limiter.limit("3/minute")
def forgot_password(
    request: Request, payload: ForgotIn, db: Session = Depends(get_db)
) -> dict:
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is not None and user.is_active:
        emails.send_password_reset_email(user)
    return {"status": "ok"}  # never reveal whether the address exists


@router.post("/password/reset", response_model=CustomerOut)
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetIn,
    response: Response,
    db: Session = Depends(get_db),
) -> User:
    try:
        claims = decode_link_token(payload.token, purpose="reset")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    user = db.get(User, int(claims.get("sub", 0)))
    if user is None or claims.get("tv") != user.token_version:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    user = service.set_password(db, user, payload.new_password)
    _issue_session(response, user)
    return user


@router.post("/verify-email", response_model=CustomerOut)
@limiter.limit("10/minute")
def verify_email(
    request: Request, payload: VerifyIn, db: Session = Depends(get_db)
) -> User:
    try:
        claims = decode_link_token(payload.token, purpose="verify")
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="This link is invalid or expired.")
    user = db.get(User, int(claims.get("sub", 0)))
    if user is None:
        raise HTTPException(status_code=400, detail="This link is invalid or expired.")
    user.email_verified = True
    db.commit()
    db.refresh(user)
    return user


@router.post("/verify-email/resend", status_code=202)
@limiter.limit("3/minute")
def resend_verification(
    request: Request, user: User = Depends(get_current_customer)
) -> dict:
    if not user.email_verified:
        emails.send_verification_email(user)
    return {"status": "ok"}


# ── Order history ────────────────────────────────────────────────────────────

@router.get("/orders", response_model=list[AccountOrderSummary])
def my_orders(
    user: User = Depends(get_current_customer), db: Session = Depends(get_db)
) -> list[AccountOrderSummary]:
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc(), Order.id.desc())
    )
    return [
        AccountOrderSummary(
            reference=o.reference,
            status=o.status,
            total=o.total,
            currency=o.currency,
            created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/orders/{reference}", response_model=AccountOrderDetail)
def my_order(
    reference: str,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> AccountOrderDetail:
    order = db.scalar(
        select(Order)
        .where(Order.reference == reference, Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.payments))
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    paid = next(
        (p for p in order.payments if p.status == PaymentStatus.SUCCESS), None
    )
    return AccountOrderDetail(
        reference=order.reference,
        status=order.status,
        total=order.total,
        currency=order.currency,
        created_at=order.created_at,
        subtotal=order.subtotal,
        shipping_amount=order.shipping_amount,
        items=[AccountOrderItemOut.model_validate(i) for i in order.items],
        delivery_city=order.delivery_city,
        delivery_state_region=order.delivery_state_region,
        delivery_country=order.delivery_country,
        delivery_address_1=order.delivery_address_1,
        delivery_address_2=order.delivery_address_2,
        delivery_postal_code=order.delivery_postal_code,
        customer_phone=order.customer_phone,
        payment_reference=paid.provider_reference if paid else None,
    )


# ── Addresses ────────────────────────────────────────────────────────────────

@router.get("/addresses", response_model=list[AddressOut])
def list_addresses(
    user: User = Depends(get_current_customer), db: Session = Depends(get_db)
) -> list:
    return service.list_addresses(db, user)


@router.post("/addresses", response_model=AddressOut, status_code=201)
def create_address(
    payload: AddressIn,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return service.create_address(db, user, payload)


@router.patch("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    payload: AddressIn,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    try:
        return service.update_address(db, user, address_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Address not found")


@router.delete("/addresses/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> None:
    try:
        service.delete_address(db, user, address_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Address not found")
    return None


# ── Measurements ─────────────────────────────────────────────────────────────

@router.get("/measurements", response_model=MeasurementProfileOut | None)
def get_measurements(
    user: User = Depends(get_current_customer), db: Session = Depends(get_db)
):
    return service.get_measurements(db, user)


@router.put("/measurements", response_model=MeasurementProfileOut)
def put_measurements(
    payload: MeasurementProfileIn,
    user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return service.upsert_measurements(db, user, payload)
