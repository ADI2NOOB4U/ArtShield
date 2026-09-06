"""Layer 2: bounded LSB watermark embedding with a tamper-evident payload."""

from __future__ import annotations

from struct import pack, unpack

from PIL import Image

from app.utils.crypto_utils import checksum

MAGIC = b"ASHW1"
HEADER_SIZE = len(MAGIC) + 4 + 32
MAX_WATERMARK_BYTES = 2048


class WatermarkError(ValueError):
    """Raised when a watermark cannot be safely embedded or extracted."""


def _bits(data: bytes):
    for byte in data:
        for shift in range(7, -1, -1):
            yield (byte >> shift) & 1


def _from_bits(bits: list[int]) -> bytes:
    return bytes(sum(bits[index + offset] << (7 - offset) for offset in range(8)) for index in range(0, len(bits), 8))


def embed_watermark(image: Image.Image, watermark: str) -> Image.Image:
    payload = watermark.encode("utf-8")
    if not payload or len(payload) > MAX_WATERMARK_BYTES:
        raise WatermarkError("watermark must be between 1 and 2048 UTF-8 bytes")
    encoded = MAGIC + pack(">I", len(payload)) + checksum(payload) + payload
    capacity = image.width * image.height * 3
    if len(encoded) * 8 > capacity:
        raise WatermarkError("image does not have enough RGB capacity for the watermark")
    result = image.copy().convert("RGBA")
    pixels = list(result.get_flattened_data())
    bit_stream = iter(_bits(encoded))
    updated = []
    for red, green, blue, alpha in pixels:
        channels = [red, green, blue]
        for index in range(3):
            try:
                channels[index] = (channels[index] & 0xFE) | next(bit_stream)
            except StopIteration:
                updated.append((*channels, alpha))
                updated.extend(pixels[len(updated):])
                result.putdata(updated)
                return result
        updated.append((*channels, alpha))
    result.putdata(updated)
    return result


def extract_watermark(image: Image.Image) -> str | None:
    pixels = list(image.convert("RGBA").get_flattened_data())
    bits = [(channel & 1) for pixel in pixels for channel in pixel[:3]]
    header = _from_bits(bits[: HEADER_SIZE * 8])
    if not header.startswith(MAGIC):
        return None
    length = unpack(">I", header[len(MAGIC) : len(MAGIC) + 4])[0]
    if length == 0 or length > MAX_WATERMARK_BYTES:
        raise WatermarkError("watermark length is invalid")
    total = HEADER_SIZE + length
    if total * 8 > len(bits):
        raise WatermarkError("watermark payload is truncated")
    payload = _from_bits(bits[: total * 8])[HEADER_SIZE:]
    expected_checksum = header[len(MAGIC) + 4 : HEADER_SIZE]
    if checksum(payload) != expected_checksum:
        raise WatermarkError("watermark integrity check failed")
    try:
        return payload.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise WatermarkError("watermark is not valid UTF-8") from exc
