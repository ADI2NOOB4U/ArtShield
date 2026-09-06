# ArtShield Exhibition Script

## Opening

ArtShield protects an artwork with three concrete image operations: a metadata-bound SHA-256 fingerprint, an embedded LSB watermark, and a bounded deterministic perturbation. The result is evidence for integrity checking, not a claim of universal AI protection or legal copyright.

## Live flow

1. Upload the artwork and enter its metadata.
2. Run **Protect artwork**.
3. Point out the generated fingerprint and protected image.
4. Explain that the watermark is embedded in RGB least-significant bits and protected with a checksum.
5. Use **Verify protected artifact**: the result checks the returned PNG against its recorded artifact hash and embedded watermark.
6. Alter the protected PNG and submit that modified file through the verification API: the result should report `TAMPERING DETECTED`.

## Blockchain explanation

The local Hardhat deployment contains separate certificate, ownership, and usage-rights contracts. The UI exposes the backend calls when blockchain configuration is available. A missing node, signer, or contract address is an environment failure and must be shown as such.

## Research explanation

Layers 8-12 are controlled synthetic experiments. Layers 13-15 are defensive analysis endpoints. They are not claims that deployed models are immune to poisoning, inversion, prompt injection, or malicious files.
