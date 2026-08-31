"""admins.token_version — session-revocation counter

Revision ID: 0004_admin_token_version
Revises: 0003_payments
Create Date: 2026-08-31

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0004_admin_token_version"
down_revision: Union[str, None] = "0003_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admins",
        sa.Column(
            "token_version", sa.Integer(), server_default="0", nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("admins", "token_version")
