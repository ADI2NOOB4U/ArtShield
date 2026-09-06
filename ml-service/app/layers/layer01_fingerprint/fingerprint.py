"""Layer 1: SHA-256 artwork fingerprint bound to canonical metadata."""

from __future__ import annotations

from typing import Any

from app.utils.crypto_utils import fingerprint_bytes


def create_fingerprint(image_bytes: bytes, metadata: dict[str, Any]) -> str:
    if not isinstance(metadata, dict):
        raise TypeError("metadata must be an object")
    return fingerprint_bytes(image_bytes, metadata)


def verify_fingerprint(image_bytes: bytes, metadata: dict[str, Any], expected: str) -> bool:
    if len(expected) != 64 or any(character not in "0123456789abcdef" for character in expected.lower()):
        return False
    return create_fingerprint(image_bytes, metadata) == expected.lower()
