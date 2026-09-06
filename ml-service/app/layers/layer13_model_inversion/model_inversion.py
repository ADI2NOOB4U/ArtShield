"""Layer 13 defensive privacy controls for a local model boundary.

This is a query-policy and confidence-suppression control, not a model
inversion tool. It never loads serialized models or accepts filesystem paths.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field

MAX_QUERIES = 20
MAX_FEATURES = 256


@dataclass
class PrivacyQueryGuard:
    max_queries: int = MAX_QUERIES
    min_interval_seconds: float = 0.0
    _queries: int = 0
    _last_query: float = field(default=0.0, init=False)

    def check(self, feature_vector: list[float]) -> dict:
        if len(feature_vector) == 0 or len(feature_vector) > MAX_FEATURES:
            raise ValueError("feature_vector must contain 1-256 values")
        if not all(math.isfinite(value) for value in feature_vector):
            raise ValueError("feature_vector contains a non-finite value")
        now = time.monotonic()
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
