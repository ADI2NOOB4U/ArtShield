"""Layer 5: explainable forgery/integrity assessment."""

from __future__ import annotations

from dataclasses import dataclass

from app.layers.layer01_fingerprint.fingerprint import verify_fingerprint
from app.layers.layer02_steganography.steganography import WatermarkError, extract_watermark
from app.utils.image_utils import encode_png, open_image


@dataclass(frozen=True)
class ForgeryAssessment:
    authentic: bool
    fingerprint_match: bool
    watermark_match: bool | None
    reasons: tuple[str, ...]


def assess_forgery(
    image_bytes: bytes,
    metadata: dict,
    expected_fingerprint: str,
    expected_watermark: str | None = None,
) -> ForgeryAssessment:
    image = open_image(image_bytes)
    fingerprint_match = verify_fingerprint(image_bytes, metadata, expected_fingerprint)
    extracted = None
    watermark_error = None
    try:
        extracted = extract_watermark(image)
    except WatermarkError as exc:
        watermark_error = str(exc)
    watermark_match = None if expected_watermark is None else extracted == expected_watermark
    reasons: list[str] = []
    if not fingerprint_match:
        reasons.append("metadata-bound fingerprint mismatch")
    if expected_watermark is not None and not watermark_match:
        reasons.append("watermark missing or mismatched")
    if watermark_error:
        reasons.append(watermark_error)
    return ForgeryAssessment(
        authentic=not reasons,
        fingerprint_match=fingerprint_match,
        watermark_match=watermark_match,
        reasons=tuple(reasons),
    )
