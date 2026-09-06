"""Layer 3: deterministic, bounded pixel perturbation for defensive testing."""

from __future__ import annotations

import hashlib

import numpy as np
from PIL import Image

MAX_DELTA = 2


def apply_perturbation(image: Image.Image, seed: str, strength: int = 1) -> Image.Image:
    if not isinstance(seed, str) or not seed or len(seed) > 128:
        raise ValueError("seed must be a non-empty bounded string")
    if isinstance(strength, bool) or not isinstance(strength, int) or strength not in range(1, MAX_DELTA + 1):
        raise ValueError("strength must be 1 or 2")
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    random = np.random.default_rng(int.from_bytes(digest[:8], "big"))
    source = np.asarray(image.convert("RGBA"), dtype=np.int16).copy()
    noise = random.integers(-strength, strength + 1, size=source.shape[:2] + (1,))
    source[:, :, :3] = np.clip(source[:, :, :3] + noise, 0, 255)
    return Image.fromarray(source.astype(np.uint8), mode="RGBA")
