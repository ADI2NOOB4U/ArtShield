"""Public API response models for Phase 1."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProtectionResponse(BaseModel):
    fingerprint: str
    watermark: str
    protected_image_base64: str
    protected_artifact_hash: str
    image_format: str = "PNG"


class VerificationResponse(BaseModel):
    authentic: bool
    fingerprint_match: bool
    watermark_match: bool | None
    artifact_hash_match: bool | None = None
    verification_scope: str = "source"
    reasons: list[str] = Field(default_factory=list)
