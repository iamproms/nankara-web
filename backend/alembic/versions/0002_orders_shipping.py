"""orders + shipping: shipping_zones, orders, order_items

Revision ID: 0002_orders_shipping
Revises: 0001_initial
Create Date: 2026-08-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_orders_shipping"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ORDER_STATUS = (
    "PENDING_PAYMENT",
    "PAID",
    "IN_PRODUCTION",
    "READY",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
)


def upgrade() -> None:
    op.create_table(
        "shipping_zones",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("region_type", sa.String(length=20), nullable=False),
        sa.Column("rate", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="NGN", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
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
        sa.CheckConstraint("rate >= 0", name="ck_shipping_zones_rate_non_negative"),
    )
    op.create_index(
        "ix_shipping_zones_code", "shipping_zones", ["code"], unique=True
    )

    # create_type=False so create_table below does not also try to emit CREATE TYPE.
    order_status = postgresql.ENUM(*ORDER_STATUS, name="order_status", create_type=False)
    order_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("customer_first_name", sa.String(length=120), nullable=False),
        sa.Column("customer_last_name", sa.String(length=120), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=False),
        sa.Column("customer_phone", sa.String(length=40), nullable=False),
        sa.Column("delivery_country", sa.String(length=120), nullable=False),
        sa.Column("delivery_address_1", sa.String(length=255), nullable=False),
        sa.Column(
            "delivery_address_2", sa.String(length=255), server_default="", nullable=False
        ),
        sa.Column("delivery_city", sa.String(length=120), nullable=False),
        sa.Column("delivery_state_region", sa.String(length=120), nullable=False),
        sa.Column(
            "delivery_postal_code", sa.String(length=40), server_default="", nullable=False
        ),
        sa.Column("delivery_notes", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "shipping_zone_id",
            sa.Integer(),
            sa.ForeignKey("shipping_zones.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("shipping_zone_name", sa.String(length=120), nullable=False),
        sa.Column("shipping_amount", sa.Integer(), nullable=False),
        sa.Column("subtotal", sa.Integer(), nullable=False),
        sa.Column("total", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), server_default="NGN", nullable=False),
        sa.Column(
            "status", order_status, server_default="PENDING_PAYMENT", nullable=False
        ),
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
        sa.CheckConstraint("subtotal >= 0", name="ck_orders_subtotal_non_negative"),
        sa.CheckConstraint(
            "shipping_amount >= 0", name="ck_orders_shipping_amount_non_negative"
        ),
        sa.CheckConstraint("total >= 0", name="ck_orders_total_non_negative"),
    )
    op.create_index("ix_orders_reference", "orders", ["reference"], unique=True)
    op.create_index("ix_orders_shipping_zone_id", "orders", ["shipping_zone_id"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "order_id",
            sa.Integer(),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("product_slug", sa.String(length=220), nullable=False),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("subtotal", sa.Integer(), nullable=False),
        sa.CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
        sa.CheckConstraint(
            "unit_price >= 0", name="ck_order_items_unit_price_non_negative"
        ),
        sa.CheckConstraint("subtotal >= 0", name="ck_order_items_subtotal_non_negative"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_shipping_zone_id", table_name="orders")
    op.drop_index("ix_orders_reference", table_name="orders")
    op.drop_table("orders")
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=True)
    op.drop_index("ix_shipping_zones_code", table_name="shipping_zones")
    op.drop_table("shipping_zones")
