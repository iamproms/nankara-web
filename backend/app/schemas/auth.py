from pydantic import BaseModel, EmailStr

from app.schemas.admin import AdminOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminOut
