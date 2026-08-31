from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    environment: str = "development"

    database_url: str = (
        "postgresql+psycopg://nankara:nankara@localhost:5433/nankara"
    )

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 480

    # NoDecode: keep pydantic-settings from JSON-parsing the raw env value so the
    # validator below can accept a plain comma-separated string.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_upload_folder: str = "nankara/products"

    # Paystack — the only MVP payment gateway (spec §13). Secret key stays
    # server-side; the browser never sees it.
    paystack_secret_key: str | None = None
    paystack_public_key: str | None = None  # kept for symmetry / a future inline flow
    paystack_base_url: str = "https://api.paystack.co"
    # Used to build the Paystack callback_url the customer returns to.
    frontend_origin: str = "http://localhost:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def cloudinary_configured(self) -> bool:
        return all(
            (
                self.cloudinary_cloud_name,
                self.cloudinary_api_key,
                self.cloudinary_api_secret,
            )
        )

    @property
    def paystack_configured(self) -> bool:
        return bool(self.paystack_secret_key)


settings = Settings()
