from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_admin
from app.core.csrf import require_trusted_origin
from app.core.database import get_db
from app.models import Order, User

router = APIRouter(
    dependencies=[Depends(get_current_admin), Depends(require_trusted_origin)]
)


class AdminCustomerListItem(BaseModel):
    id: int
    email: EmailStr
    name: str
    email_verified: bool
    order_count: int
    created_at: datetime


class AdminCustomerOrder(BaseModel):
    reference: str
    status: str
    total: int
    created_at: datetime


class AdminCustomerDetail(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    email_verified: bool
    is_active: bool
    created_at: datetime
    orders: list[AdminCustomerOrder]


@router.get("", response_model=list[AdminCustomerListItem])
def list_customers(db: Session = Depends(get_db)) -> list[AdminCustomerListItem]:
    counts = dict(
        db.execute(
            select(Order.user_id, func.count())
            .where(Order.user_id.is_not(None))
            .group_by(Order.user_id)
        ).all()
    )
    users = db.scalars(select(User).order_by(User.created_at.desc()))
    return [
        AdminCustomerListItem(
            id=u.id,
            email=u.email,
            name=f"{u.first_name} {u.last_name}".strip(),
            email_verified=u.email_verified,
            order_count=counts.get(u.id, 0),
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/{customer_id}", response_model=AdminCustomerDetail)
def get_customer(
    customer_id: int, db: Session = Depends(get_db)
) -> AdminCustomerDetail:
    user = db.scalar(
        select(User)
        .where(User.id == customer_id)
        .options(selectinload(User.orders))
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return AdminCustomerDetail(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        email_verified=user.email_verified,
        is_active=user.is_active,
        created_at=user.created_at,
        orders=[
            AdminCustomerOrder(
                reference=o.reference,
                status=o.status.value,
                total=o.total,
                created_at=o.created_at,
            )
            for o in sorted(user.orders, key=lambda o: o.id, reverse=True)
        ],
    )
