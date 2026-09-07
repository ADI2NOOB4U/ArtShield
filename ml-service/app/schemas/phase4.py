from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, StrictFloat


class StrictRequest(BaseModel):
    """Reject fields that are not part of the public ML API contract."""

    model_config = ConfigDict(extra="forbid")


class InversionRequest(StrictRequest):
    feature_vector: list[StrictFloat] = Field(min_length=1, max_length=256)
    max_queries: int = Field(default=20, ge=1, le=20)


class PromptRequest(StrictRequest):
    prompt: str = Field(min_length=1, max_length=16_384)
    policy: str = Field(default="WARN", pattern="^(ALLOW|WARN|BLOCK)$")


class FileCheckRequest(StrictRequest):
    filename: str = Field(min_length=1, max_length=255)
    declared_mime: str | None = Field(default=None, min_length=1, max_length=128)
    data_base64: str = Field(min_length=1, max_length=14_000_000)
