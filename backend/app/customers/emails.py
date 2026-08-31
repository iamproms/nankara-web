from app.core.config import settings
from app.core.security import create_link_token
from app.models import User
from app.notifications import templates
from app.notifications.resend_client import send_email

_VERIFY_TTL_MINUTES = 60 * 24 * 3  # 3 days
_RESET_TTL_MINUTES = 60  # 1 hour


def _link(path: str, token: str) -> str:
    return f"{settings.frontend_origin.rstrip('/')}{path}?token={token}"


def send_verification_email(user: User) -> None:
    token = create_link_token(
        str(user.id),
        purpose="verify",
        token_version=user.token_version,
        ttl_minutes=_VERIFY_TTL_MINUTES,
    )
    subject, html = templates.verification_email(
        first_name=user.first_name, link=_link("/verify-email", token)
    )
    send_email(to=user.email, subject=subject, html=html)


def send_password_reset_email(user: User) -> None:
    token = create_link_token(
        str(user.id),
        purpose="reset",
        token_version=user.token_version,
        ttl_minutes=_RESET_TTL_MINUTES,
    )
    subject, html = templates.password_reset_email(
        first_name=user.first_name, link=_link("/reset-password", token)
    )
    send_email(to=user.email, subject=subject, html=html)
