from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth.dependencies import get_current_admin
from app.media.cloudinary_client import upload_image

router = APIRouter()

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/avif"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", dependencies=[Depends(get_current_admin)])
async def upload(file: UploadFile = File(...)) -> dict:
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {file.content_type}",
        )
    contents = await file.read()
    if len(contents) > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the 10 MB limit.",
        )
    return upload_image(contents)
