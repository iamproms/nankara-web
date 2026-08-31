from pydantic import BaseModel, ConfigDict, Field


class ShippingQuoteRequest(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    state_region: str | None = Field(default=None, max_length=120)


class ShippingQuoteOut(BaseModel):
    zone_code: str
    zone_name: str
    amount: int
    currency: str


class ShippingZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    region_type: str
    rate: int
    currency: str
    is_active: bool


class ShippingZoneUpdate(BaseModel):
    rate: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
