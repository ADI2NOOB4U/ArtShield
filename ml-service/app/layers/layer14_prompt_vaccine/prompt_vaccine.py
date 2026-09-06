"""Layer 14 defensive prompt-input analysis and policy enforcement."""

from __future__ import annotations

import base64
import binascii
import re
import unicodedata
from dataclasses import dataclass

MAX_PROMPT_LENGTH = 16_384
ZERO_WIDTH = {"\u200b", "\u200c", "\u200d", "\ufeff"}
PATTERNS = {
    "instruction_override": re.compile(r"\b(ignore|disregard|forget)\b.{0,80}\b(previous|system|developer|instructions?)\b", re.I | re.S),
    "role_impersonation": re.compile(r"\b(system|developer|assistant)\s*(message|prompt|instruction)\s*:", re.I),
    "delimiter_attack": re.compile(r"(```|</?system>|\[\[/?(?:system|instructions?)\]\])", re.I),
    "encoded_content": re.compile(r"\b(?:base64|hex)\s*(?:decode|encoded?)\b", re.I),
}


@dataclass(frozen=True)
class PromptDecision:
    policy: str
    normalized: str
    risk_score: float
    signals: tuple[str, ...]
    reason_codes: tuple[str, ...]


def normalize_prompt(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("prompt must be a string")
    if len(value) > MAX_PROMPT_LENGTH:
        raise ValueError("prompt exceeds the 16384 character limit")
    normalized = unicodedata.normalize("NFKC", value)
    normalized = "".join(" " if char.isspace() or char in ZERO_WIDTH else char for char in normalized if not unicodedata.category(char).startswith("C"))
    return re.sub(r"\s+", " ", normalized).strip()


def analyze_prompt(value: str, policy: str = "WARN") -> PromptDecision:
    if policy not in {"ALLOW", "WARN", "BLOCK"}:
        raise ValueError("policy must be ALLOW, WARN, or BLOCK")
    normalized = normalize_prompt(value)
    signals = [name for name, pattern in PATTERNS.items() if pattern.search(normalized)]
    try:
        decoded = base64.b64decode(normalized, validate=True).decode("utf-8") if len(normalized) % 4 == 0 else ""
    except (binascii.Error, UnicodeError, ValueError):
        decoded = ""
    if decoded and any(pattern.search(decoded) for pattern in PATTERNS.values()):
        signals.append("encoded_instruction")
    has_cyrillic = any(unicodedata.name(char, "").startswith("CYRILLIC") for char in normalized)
    has_latin = any(unicodedata.name(char, "").startswith("LATIN") for char in normalized)
    if has_cyrillic and has_latin:
        signals.append("mixed_script")
    score = min(1.0, len(signals) * 0.25 + (0.15 if "mixed_script" in signals else 0))
    decision = "SAFE" if not signals else ("BLOCKED" if policy == "BLOCK" else "SUSPICIOUS")
    return PromptDecision(policy=policy, normalized=normalized, risk_score=score, signals=tuple(signals), reason_codes=tuple(signals))
