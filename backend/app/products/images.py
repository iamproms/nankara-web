from collections.abc import Sequence

from app.models import Product, ProductImage
from app.schemas.product import ProductImageIn


def apply_images(product: Product, images: Sequence[ProductImageIn]) -> None:
    """Replace a product's images with `images`, ordered by list position.

    Exactly one image is marked primary: the one the caller flagged, or the
    first image when none was flagged.
    """
    product.images.clear()

    explicit_primary = next(
        (index for index, image in enumerate(images) if image.is_primary), None
    )
    primary_index = explicit_primary if explicit_primary is not None else 0

    for index, image in enumerate(images):
        product.images.append(
            ProductImage(
                url=image.url,
                public_id=image.public_id,
                alt_text=image.alt_text or "",
                sort_order=index,
                is_primary=(index == primary_index),
            )
        )
