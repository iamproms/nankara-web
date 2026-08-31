"""customer accounts: users, user_addresses, measurement_profiles + orders.user_id FK

Revision ID: 0005_users
Revises: 0004_admin_token_version
Create Date: 2026-08-31

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0005_users"
down_revision: Union[str, None] = "0004_admin_token_version"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _timestamps() -> list[sa.Column]:
    return [
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
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=40), server_default="", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column(
            "email_verified", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
        sa.Column("token_version", sa.Integer(), server_default="0", nullable=False),
        *_timestamps(),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_addresses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(length=60), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("country_code", sa.String(length=2), nullable=False),
        sa.Column("country_name", sa.String(length=120), nullable=False),
        sa.Column("address_1", sa.String(length=255), nullable=False),
        sa.Column("address_2", sa.String(length=255), server_default="", nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("state_region", sa.String(length=120), nullable=False),
        sa.Column(
            "postal_code", sa.String(length=40), server_default="", nullable=False
        ),
        sa.Column(
            "recipient_phone", sa.String(length=40), server_default="", nullable=False
        ),
        *_timestamps(),
    )
    op.create_index(
        "ix_user_addresses_user_id", "user_addresses", ["user_id"]
    )

    op.create_table(
        "measurement_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("bust_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("waist_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("hip_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("shoulder_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("sleeve_length_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("dress_length_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("height_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.UniqueConstraint("user_id", name="uq_measurement_profiles_user_id"),
        *_timestamps(),
    )

    # orders.user_id already exists as a plain Integer column (from 0002); add the
    # FK constraint + index now that `users` exists.
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_foreign_key(
        "fk_orders_user_id_users",
        "orders",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_orders_user_id_users", "orders", type_="foreignkey")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("measurement_profiles")
    op.drop_index("ix_user_addresses_user_id", table_name="user_addresses")
    op.drop_table("user_addresses")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
