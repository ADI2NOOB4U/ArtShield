"""Strict image input validation shared by the protection layers."""

from __future__ import annotations

from io import BytesIO

from PIL import Image, UnidentifiedImageError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 25_000_000
ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP"}


class InvalidImage(ValueError):
    """Raised when an upload is not an acceptable raster image."""


def open_image(image_bytes: bytes) -> Image.Image:
    if not image_bytes:
        raise InvalidImage("image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise InvalidImage("image exceeds the 10 MiB limit")
    try:
        image = Image.open(BytesIO(image_bytes))
        image.verify()
        image = Image.open(BytesIO(image_bytes))
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImage("image is not a valid PNG, JPEG, or WebP file") from exc
    if image.format not in ALLOWED_FORMATS:
        raise InvalidImage("image format is not supported")
    if image.width * image.height > MAX_PIXELS:
        raise InvalidImage("image has too many pixels")
    return image.convert("RGBA")


def encode_png(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()
