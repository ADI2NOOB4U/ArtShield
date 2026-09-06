"""Layer 13 defensive privacy controls for a local model boundary.

This is a query-policy and confidence-suppression control, not a model
inversion tool. It never loads serialized models or accepts filesystem paths.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from threading import Lock

MAX_QUERIES = 20
MAX_FEATURES = 256


@dataclass
class PrivacyQueryGuard:
    max_queries: int = MAX_QUERIES
    min_interval_seconds: float = 0.0
    _queries: int = 0
    _last_query: float = field(default=0.0, init=False)
    _lock: Lock = field(default_factory=Lock, init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        if isinstance(self.max_queries, bool) or not isinstance(self.max_queries, int) or not 1 <= self.max_queries <= MAX_QUERIES:
            raise ValueError("max_queries must be between 1 and 20")
        if isinstance(self.min_interval_seconds, bool) or not isinstance(self.min_interval_seconds, (int, float)) or not math.isfinite(self.min_interval_seconds) or self.min_interval_seconds < 0:
            raise ValueError("min_interval_seconds must be a finite non-negative number")

    def check(self, feature_vector: list[float]) -> dict:
        if len(feature_vector) == 0 or len(feature_vector) > MAX_FEATURES:
            raise ValueError("feature_vector must contain 1-256 values")
        if any(isinstance(value, bool) for value in feature_vector):
            raise ValueError("feature_vector must contain numeric values")
        try:
            finite = all(math.isfinite(value) for value in feature_vector)
        except (TypeError, ValueError) as exc:
            raise ValueError("feature_vector must contain numeric values") from exc
        if not finite:
            raise ValueError("feature_vector contains a non-finite value")
        now = time.monotonic()
        with self._lock:
            if self._queries >= self.max_queries:
                return {"allowed": False, "reason": "query_limit_exceeded", "remaining": 0}
            if now - self._last_query < self.min_interval_seconds:
                return {"allowed": False, "reason": "query_rate_limited", "remaining": self.max_queries - self._queries}
            self._queries += 1
            self._last_query = now
            return {"allowed": True, "reason": "allowed", "remaining": self.max_queries - self._queries}


def suppress_confidence(probabilities: list[float], minimum: float = 0.05, maximum: float = 0.95) -> list[float]:
    if not 0 <= minimum < maximum <= 1:
        raise ValueError("confidence bounds are invalid")
    if not probabilities or any(not math.isfinite(value) or not 0 <= value <= 1 for value in probabilities):
        raise ValueError("probabilities must be finite values between 0 and 1")
    return [min(max(value, minimum), maximum) for value in probabilities]
