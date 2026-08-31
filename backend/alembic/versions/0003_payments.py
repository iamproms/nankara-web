"""payments: payment_status enum + payments table

Revision ID: 0003_payments
Revises: 0002_orders_shipping
Create Date: 2026-08-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_payments"
down_revision: Union[str, None] = "0002_orders_shipping"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PAYMENT_STATUS = ("PENDING", "SUCCESS", "FAILED", "ABANDONED")


def upgrade() -> None:
    # create_type=False so create_table below does not also try to emit CREATE TYPE.
    payment_status = postgresql.ENUM(
        *PAYMENT_STATUS, name="payment_status", create_type=False
    )
    payment_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "provider", sa.String(length=20), server_default="paystack", nullable=False
        ),
        sa.Column("provider_reference", sa.String(length=64), nullable=False),
        sa.Column("access_code", sa.String(length=64), nullable=True),
        sa.Column("authorization_url", sa.String(length=500), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="NGN", nullable=False),
        sa.Column(
            "status", payment_status, server_default="PENDING", nullable=False
        ),
        sa.Column(
            "raw_event",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("amount >= 0", name="ck_payments_amount_non_negative"),
    )
    op.create_index(
        "ix_payments_provider_reference",
        "payments",
        ["provider_reference"],
        unique=True,
    )
    op.create_index("ix_payments_order_id", "payments", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_payments_order_id", table_name="payments")
    op.drop_index("ix_payments_provider_reference", table_name="payments")
    op.drop_table("payments")
    sa.Enum(name="payment_status").drop(op.get_bind(), checkfirst=True)
