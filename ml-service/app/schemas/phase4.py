from __future__ import annotations

from pydantic import BaseModel, Field


class InversionRequest(BaseModel):
    feature_vector: list[float] = Field(min_length=1, max_length=256)
    max_queries: int = Field(default=20, ge=1, le=20)


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=16_384)
    policy: str = Field(default="WARN", pattern="^(ALLOW|WARN|BLOCK)$")


class FileCheckRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    declared_mime: str | None = Field(default=None, max_length=128)
    data_base64: str = Field(min_length=1, max_length=14_000_000)
