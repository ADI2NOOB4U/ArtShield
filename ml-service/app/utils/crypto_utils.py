"""Cryptographic helpers for artwork identity and metadata binding."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical_metadata(metadata: dict[str, Any]) -> bytes:
    """Serialize metadata deterministically so equivalent values hash identically."""
    return json.dumps(metadata, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("utf-8")


def fingerprint_bytes(image_bytes: bytes, metadata: dict[str, Any]) -> str:
    digest = hashlib.sha256()
    digest.update(b"ARTSHIELD-FINGERPRINT-V1\0")
    digest.update(len(image_bytes).to_bytes(8, "big"))
    digest.update(image_bytes)
    digest.update(canonical_metadata(metadata))
    return digest.hexdigest()


def checksum(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()


def artifact_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
