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

## Optional local blockchain

Docker is not required for the core image demo. For Phase 2 blockchain demonstrations, run a local Hardhat node, deploy the Phase 2 contracts with `npm run deploy:phase2`, and configure the backend with the resulting RPC, contract addresses, chain ID, and a local test signer private key through environment variables. Never use the printed Hardhat test keys on a public network.

## Validation

Run the existing ML, backend, frontend, and blockchain test/build commands before an exhibition. PostgreSQL and Redis runtime checks require Docker and are not part of the core image-only walkthrough.
