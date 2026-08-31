"""Minimal branded HTML for account emails. Order-status emails come later."""

_WRAP = """\
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
            max-width:520px;margin:0 auto;color:#0F0F0F">
  <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;
            color:#B8460A;margin-bottom:24px">NANKARA</p>
  {body}
  <p style="font-size:12px;color:#6B6B6B;margin-top:32px">
    If you didn't request this, you can safely ignore this email.
  </p>
</div>"""


def _button(href: str, label: str) -> str:
    return (
        f'<p style="margin:24px 0"><a href="{href}" '
        f'style="background:#0F0F0F;color:#fff;text-decoration:none;'
        f'padding:12px 28px;display:inline-block;font-size:13px;'
        f'letter-spacing:.08em;text-transform:uppercase">{label}</a></p>'
    )


def verification_email(*, first_name: str, link: str) -> tuple[str, str]:
    body = (
        f"<h1 style='font-weight:300;font-size:24px'>Confirm your email</h1>"
        f"<p style='line-height:1.7;color:#6B6B6B'>Hi {first_name}, please confirm "
        f"your email address to finish setting up your Nankara account.</p>"
        f"{_button(link, 'Confirm email')}"
        f"<p style='font-size:12px;color:#6B6B6B'>Or paste this link: {link}</p>"
    )
    return "Confirm your Nankara email", _WRAP.format(body=body)


def password_reset_email(*, first_name: str, link: str) -> tuple[str, str]:
    body = (
        f"<h1 style='font-weight:300;font-size:24px'>Reset your password</h1>"
        f"<p style='line-height:1.7;color:#6B6B6B'>Hi {first_name}, use the link "
        f"below to choose a new password. It expires in 1 hour.</p>"
        f"{_button(link, 'Reset password')}"
        f"<p style='font-size:12px;color:#6B6B6B'>Or paste this link: {link}</p>"
    )
    return "Reset your Nankara password", _WRAP.format(body=body)
