from pydantic import BaseModel, Field


class PaymentInitIn(BaseModel):
    reference: str = Field(min_length=1, max_length=64)


class PaymentInitOut(BaseModel):
    authorization_url: str
    reference: str


class PaymentVerifyIn(BaseModel):
    reference: str = Field(min_length=1, max_length=64)
