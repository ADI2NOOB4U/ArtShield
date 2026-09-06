# Phase 4 Security Research

## Layer 13: Model inversion defense

Threat model: a local model boundary exposed to repeated feature-vector queries. The implemented control is query counting, optional rate limiting, finite-vector validation, and confidence suppression to reduce exposed certainty. This is a defensive boundary, not an inversion attack implementation. Black-box, gray-box, and white-box privacy protection are not generally claimed; only the tested query-policy behavior is covered.

## Layer 14: Prompt injection vaccine

User-controlled text is NFKC-normalized, invisible/control characters are handled, whitespace is normalized, and structured signals cover instruction overrides, role impersonation, delimiters, encoded instructions, and a limited mixed-script signal. Policy is ALLOW, WARN, or BLOCK. Detection is heuristic and not universal.

## Layer 15: Polyglot bomb detection

The analyzer bounds input to 10 MiB, rejects traversal-like filenames, compares extension/magic/declaration, detects executable/archive signatures, multiple signatures, unknown formats, and PNG trailing bytes. It never executes or recursively extracts files. It is a bounded screening layer, not a complete parser sandbox or malware detector.

All claims are limited to controlled tests and the implemented input classes. Docker/PostgreSQL/Redis runtime behavior remains environment-dependent.
