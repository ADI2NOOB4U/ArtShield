"""Layer 15 bounded file-signature and parser-disagreement analysis."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePath

MAX_BYTES = 10 * 1024 * 1024
SIGNATURES = {
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff",
    "gif": b"GIF8",
    "pdf": b"%PDF-",
    "zip": b"PK\x03\x04",
    "exe": b"MZ",
}


@dataclass(frozen=True)
class FileSecurityResult:
    decision: str
    detected_format: str | None
    extension: str
    signals: tuple[str, ...]
    trailing_bytes: int


def _extension(filename: str) -> str:
    name = PurePath(filename).name
    if name != filename or "\x00" in filename:
        raise ValueError("filename must be a simple basename")
    return PurePath(name).suffix.lower().lstrip(".")


def analyze_file(data: bytes, filename: str, declared_mime: str | None = None) -> FileSecurityResult:
    if not isinstance(data, bytes) or not data:
        raise ValueError("file data is empty")
    if len(data) > MAX_BYTES:
        raise ValueError("file exceeds the 10 MiB limit")
    extension = _extension(filename)
    matches = [name for name, signature in SIGNATURES.items() if data.startswith(signature)]
    detected = matches[0] if matches else None
    signals: list[str] = []
    embedded = [name for name, signature in SIGNATURES.items() if data.find(signature, 1, min(len(data), 1_048_576)) >= 0]
    if embedded:
        signals.append("embedded_conflicting_signature")
    if len(matches) > 1:
        signals.append("multiple_file_signatures")
    if detected is None:
        signals.append("unknown_magic_bytes")
    if extension and detected and extension != detected and not (extension == "jpg" and detected == "jpeg"):
        signals.append("extension_format_mismatch")
    if declared_mime and detected and not declared_mime.lower().endswith(detected):
        signals.append("declared_mime_mismatch")
    if detected in {"exe", "zip"}:
        signals.append("executable_or_archive_signature")
    trailing = 0
    if detected == "png" and b"IEND\xaeB`\x82" in data:
        end = data.find(b"IEND\xaeB`\x82") + 8
        trailing = len(data) - end
        if trailing:
            signals.append("trailing_payload")
    decision = "BLOCKED" if any(signal in signals for signal in ("multiple_file_signatures", "executable_or_archive_signature", "trailing_payload")) else ("SUSPICIOUS" if signals else "SAFE")
    return FileSecurityResult(decision, detected, extension, tuple(signals), trailing)
