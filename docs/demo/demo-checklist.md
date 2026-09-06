# ArtShield Exhibition Checklist

## Before the demo

1. Confirm Node.js, npm, Python, and the ML requirements are installed.
2. Start the ML service from `ml-service/` with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
3. Start the backend from `backend/` with `npm start`.
4. Start the frontend from `frontend/` with `npm run dev`.
5. Open the Vite URL, normally `http://localhost:5173`.

The primary live path is frontend upload -> backend `/api/protection` -> ML `/v1/protect` -> protected PNG and fingerprint.

## Demonstration

1. Choose a small PNG, JPEG, or WebP image.
2. Enter title, artist, and a short watermark.
3. Select **Protect artwork**.
4. Show the protected PNG, SHA-256 fingerprint, and embedded watermark.
5. Select **Verify protected artifact** to verify the returned protected PNG against its recorded artifact hash and watermark.
6. Modify one byte/pixel in the protected PNG, select that modified protected file only if using the API directly, and verify it again to show an artifact-hash mismatch.

## Phase 2 note

Ownership and rights controls require a running local Hardhat node plus the deployed addresses and signer configuration from `blockchain/deployments/localhost.json`. They are real backend/blockchain operations, not simulated confirmations.

## Honest limitations

- Docker, PostgreSQL, and Redis are not required for the core protection walkthrough and remain environment-dependent.
- Layer 5 verifies a protected artifact using a sidecar artifact hash and watermark integrity; it is not a trained forgery classifier.
- Layers 8-15 are research/security-analysis surfaces and are not silently shown as part of the core upload pipeline.
