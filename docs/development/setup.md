# ArtShield Local Setup

## Core services

Install the service dependencies, then run these processes in separate terminals:

```powershell
Push-Location ml-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
Push-Location backend
$env:ML_SERVICE_URL="http://127.0.0.1:8000"
npm start
```

```powershell
Push-Location frontend
npm run dev
```

The frontend expects the backend at `http://localhost:3000` unless `VITE_API_URL` is configured.

## Browser mutation authentication

Protected browser mutations use a server-validated HttpOnly session. Configure `SESSION_SECRET` (at least 32 characters), `ARTSHIELD_AUTH_USERNAME`, `ARTSHIELD_AUTH_PASSWORD`, and `ARTSHIELD_AUTH_NAME` on the backend only. Keep all `ARTSHIELD_*_TOKEN` values on the backend; they must not be added to Vercel or any `VITE_*` variable.

For the deployed frontend, set the backend `CORS_ORIGINS` value to include `https://art-shield-alpha.vercel.app`. The frontend uses credentialed requests, while the existing Vite development proxy continues to inject scoped service credentials locally.

## Optional local blockchain

Docker is not required for the core image demo. For Phase 2 blockchain demonstrations, run a local Hardhat node, deploy the Phase 2 contracts with `npm run deploy:phase2`, and configure the backend with the resulting RPC, contract addresses, chain ID, and a local test signer private key through environment variables. Never use the printed Hardhat test keys on a public network.

## Validation

Run the existing ML, backend, frontend, and blockchain test/build commands before an exhibition. PostgreSQL and Redis runtime checks require Docker and are not part of the core image-only walkthrough.
