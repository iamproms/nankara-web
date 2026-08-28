"""Thin wrapper around the Cloudinary SDK.

Product images are stored on Cloudinary rather than in the database
(NANKARA_SHOP_MVP.md §7). Configuration comes from the environment; if it is
missing, upload/delete raise a clear 503 instead of failing obscurely.
"""

from typing import BinaryIO

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status

from app.core.config import settings

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not settings.cloudinary_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
            ),
        )
    if not _configured:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        _configured = True


def upload_image(file: BinaryIO, *, folder: str | None = None) -> dict:
    _ensure_configured()
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder or settings.cloudinary_upload_folder,
            resource_type="image",
        )
    except Exception as exc:  # cloudinary raises its own error types
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cloudinary upload failed: {exc}",
        ) from exc
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
    }


def delete_image(public_id: str) -> None:
    """Best-effort delete. Callers should not fail a request if this fails."""
    _ensure_configured()
    cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
