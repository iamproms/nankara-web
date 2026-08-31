from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import MeasurementProfile, Order, User, UserAddress
from app.schemas.account import (
    AddressIn,
    MeasurementProfileIn,
    ProfileUpdateIn,
    RegisterIn,
)


class EmailTaken(Exception):
    pass


class BadCredentials(Exception):
    pass


class AccountDisabled(Exception):
    pass


def _normalise_email(email: str) -> str:
    return email.strip().lower()


def claim_guest_orders(db: Session, user: User) -> int:
    """Attach any NULL-user orders placed as a guest with this email."""
    result = db.execute(
        Order.__table__.update()
        .where(
            func.lower(Order.customer_email) == user.email,
            Order.user_id.is_(None),
        )
        .values(user_id=user.id)
    )
    return result.rowcount or 0


def register(db: Session, payload: RegisterIn) -> User:
    email = _normalise_email(payload.email)
    if db.scalar(select(User).where(User.email == email)) is not None:
        raise EmailTaken()
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone or "",
    )
    db.add(user)
    db.flush()
    claim_guest_orders(db, user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == _normalise_email(email)))
    if user is None or not verify_password(password, user.password_hash):
        raise BadCredentials()
    if not user.is_active:
        raise AccountDisabled()
    claim_guest_orders(db, user)
    db.commit()
    return user


def update_profile(db: Session, user: User, payload: ProfileUpdateIn) -> User:
    data = payload.model_dump(exclude_unset=True)
    for field in ("first_name", "last_name", "phone"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current: str, new: str) -> User:
    if not verify_password(current, user.password_hash):
        raise BadCredentials()
    user.password_hash = hash_password(new)
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


def set_password(db: Session, user: User, new: str) -> User:
    """Password reset — no current-password check; invalidates outstanding sessions."""
    user.password_hash = hash_password(new)
    user.token_version += 1
    db.commit()
    db.refresh(user)
    return user


# ── Addresses ────────────────────────────────────────────────────────────────

def list_addresses(db: Session, user: User) -> list[UserAddress]:
    return list(
        db.scalars(
            select(UserAddress)
            .where(UserAddress.user_id == user.id)
            .order_by(UserAddress.is_default.desc(), UserAddress.id)
        )
    )


def _clear_defaults(db: Session, user: User, keep_id: int | None = None) -> None:
    for addr in db.scalars(
        select(UserAddress).where(
            UserAddress.user_id == user.id, UserAddress.is_default.is_(True)
        )
    ):
        if addr.id != keep_id:
            addr.is_default = False


def create_address(db: Session, user: User, payload: AddressIn) -> UserAddress:
    existing = db.scalar(
        select(func.count()).select_from(UserAddress).where(
            UserAddress.user_id == user.id
        )
    )
    is_default = payload.is_default or existing == 0
    if is_default:
        _clear_defaults(db, user)
    addr = UserAddress(user_id=user.id, **payload.model_dump())
    addr.is_default = is_default
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


def update_address(
    db: Session, user: User, address_id: int, payload: AddressIn
) -> UserAddress:
    addr = db.get(UserAddress, address_id)
    if addr is None or addr.user_id != user.id:
        raise KeyError(address_id)
    for key, value in payload.model_dump().items():
        setattr(addr, key, value)
    if payload.is_default:
        _clear_defaults(db, user, keep_id=addr.id)
        addr.is_default = True
    db.commit()
    db.refresh(addr)
    return addr


def delete_address(db: Session, user: User, address_id: int) -> None:
    addr = db.get(UserAddress, address_id)
    if addr is None or addr.user_id != user.id:
        raise KeyError(address_id)
    was_default = addr.is_default
    db.delete(addr)
    db.flush()
    if was_default:
        remaining = db.scalar(
            select(UserAddress)
            .where(UserAddress.user_id == user.id)
            .order_by(UserAddress.id)
        )
        if remaining is not None:
            remaining.is_default = True
    db.commit()


# ── Measurements ─────────────────────────────────────────────────────────────

def get_measurements(db: Session, user: User) -> MeasurementProfile | None:
    return db.scalar(
        select(MeasurementProfile).where(MeasurementProfile.user_id == user.id)
    )


def upsert_measurements(
    db: Session, user: User, payload: MeasurementProfileIn
) -> MeasurementProfile:
    profile = get_measurements(db, user)
    if profile is None:
        profile = MeasurementProfile(user_id=user.id)
        db.add(profile)
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
