# ArtShield: Multi-Layer AI-Resistant Art Protection & Poisoning System

## Project Status

**Phase 0 — Repository scaffolding and architecture definition.**

ArtShield is in its initial scaffolding phase. This phase establishes the repository layout, service boundaries, and target architecture. As of Phase 0:

- No application feature is implemented.
- No security layer (of the 15 described below) is implemented.
- No API endpoint, smart contract, or ML pipeline is implemented.
- No production service is running or deployed.
- The only running infrastructure is local development infrastructure: PostgreSQL and Redis, via the root `docker-compose.yml`.

Everything else in this document describes the **target** design that the current scaffold is being built toward, unless explicitly marked as part of the **current scaffold**.

## Overview

**ArtShield** is a planned cybersecurity platform intended to protect digital artwork against AI-driven threats, forgery, and unauthorized reuse. The design combines cryptographic fingerprinting, steganographic watermarking, adversarial ML techniques, blockchain-backed ownership verification, and model poisoning mechanisms into a multi-layered defense ecosystem for artists and creators.

Once built, ArtShield is intended to provide:
- **Cryptographic proof of authenticity** via distributed ownership ledgers
- **AI-resistant watermarking** through adversarial perturbation and steganography
- **Forgery detection** using ML classifiers
- **Data poisoning** to contaminate unauthorized training datasets
- **Blockchain integration** for immutable ownership and usage rights
- **IPFS decentralized storage** for artwork distribution and integrity

## Problem

Digital artists face critical vulnerabilities:

1. **AI Training Theft**: Artwork can be harvested and used to train generative models without consent
2. **Forgery & Deepfakes**: Unauthorized copies and AI-generated imitations undermine creator reputation
3. **Attribution Loss**: Decentralized creation environments make proof of ownership difficult
4. **Usage Abuse**: Commercial reuse without licensing or royalty tracking
5. **Data Poisoning Vulnerability**: No active defense mechanism prevents misuse of training data
6. **Detection Gaps**: Current watermarking/fingerprinting is easily defeated by noise, cropping, or AI enhancement

Traditional watermarking and copyright systems are passive, reactive, and often insufficient against modern adversarial attacks. ArtShield's goal is to introduce **active, adversarial defense mechanisms** that poison and degrade model quality when trained on protected artwork.

## Solution

ArtShield is designed around a **15-layer security framework** combining:

- **Passive Protection**: Cryptographic fingerprinting, steganographic watermarking, and blockchain certificates
- **Active Defense**: Adversarial perturbations, model inversion defenses, and prompt injection vaccines
- **Offensive Poisoning**: Feature space contamination, gradient-based adversarial attacks, and backdoor triggers intended to degrade model quality when trained on protected data
- **Detection & Analysis**: Forgery classification and polyglot bomb detection
- **Ownership & Rights**: NFT certificates of authenticity, distributed ledgers, and smart contract-based licensing

The system is designed to be modular and independently deployable per service (frontend, backend, ML service, blockchain), with an MVP scope targeting Layers 1–5 and a longer-term roadmap covering the full 15-layer architecture. All of this is design intent — none of it is built yet.

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ArtShield System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐      ┌──────────────────┐                 │
│  │  Frontend       │      │  Backend         │                 │
│  │  (planned)      │──────│  (scaffolded)    │                 │
│  │  Port 5173      │      │  Node/Express    │                 │
│  │                 │      │  Port 3000       │                 │
│  └────────┬────────┘      └────────┬─────────┘                 │
│           │                        │                           │
│           └────────────┬───────────┘                           │
│                        │                                       │
│           ┌────────────▼──────────────┐                        │
│           │  ML Service (scaffolded)  │                        │
│           │  FastAPI + planned models │                        │
│           │  Port 8000                │                        │
│           └────────────┬─────────────┘                         │
│                        │                                       │
│    ┌───────────────────┼───────────────────┐                  │
│    │                   │                   │                  │
│ ┌──▼──┐         ┌─────▼────┐      ┌──────▼─────┐             │
│ │ DB  │         │  Cache   │      │ Blockchain │             │
│ │ PG  │         │  Redis   │      │ (scaffolded│             │
│ │5432 │         │  6379    │      │  contracts,│             │
│ └─────┘         └──────────┘      │  planned)  │             │
│                                    │  RPC 8545  │             │
│                                    └──────┬─────┘             │
│                                           │                  │
│                                   ┌───────▼────────┐          │
│                                   │ IPFS (planned) │          │
│                                   └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

PostgreSQL and Redis are the only components currently running, via the root `docker-compose.yml`. Frontend, backend business logic, ML pipeline logic, blockchain contracts, and IPFS integration are scaffolded as empty or near-empty directory structures, not running services.

## Intended Data Flow

This describes the target end-to-end flow once the corresponding layers are built. **None of it is implemented yet.**

1. **Upload**: Artist uploads artwork → Frontend validates → Backend stores metadata
2. **Protection**: ML service applies security layers → Fingerprint + watermark + blockchain certificate generated
3. **Storage**: Protected artwork → IPFS → Content hash → Blockchain record
4. **Detection**: Suspect artwork → Forgery classifier → Confidence score + poisoning status
5. **Rights Management**: NFT minting → Smart contract licensing → Usage token distribution

## Technology Stack

The stack below reflects the intended tooling per service. Presence in this list does not imply the integration is built — see [Project Status](#project-status) and [Repository Structure](#repository-structure) for what currently exists.

### Frontend (planned)
- React with TypeScript
- Vite for development and builds
- Tailwind CSS
- Axios for API communication
- Web3.js for blockchain interaction

### Backend (scaffolded — see Repository Structure)
- Node.js, Express, TypeScript
- PostgreSQL for relational data
- Redis for caching and session state
- JWT for authentication (planned)

### ML Service (scaffolded — see Repository Structure)
- Python, FastAPI
- PyTorch for adversarial ML and neural networks (planned)
- OpenCV, Pillow for image processing (planned)
- NumPy, SciPy, scikit-learn (planned)

### Blockchain & Smart Contracts (scaffolded — see Repository Structure)
- Solidity
- Hardhat for contract development and testing
- ethers.js for contract interaction (planned)
- OpenZeppelin contract standards (planned, ERC-721 / ERC-20)

### Storage & Infrastructure
- IPFS for decentralized storage (planned)
- Docker and Docker Compose for containerization (Postgres + Redis currently; see [Docker](#docker))
- PostgreSQL 14+, Redis — running in Phase 0 dev environment

## 15 Security Layers

ArtShield is designed around a 15-layer defense system. These are **design targets**. No layer is implemented. The MVP scope targets Layers 1–5.

Layers 1, 2, 3, 5, and 8–15 map to planned modules under `ml-service/app/layers/`. Layers 4, 6, and 7 are ownership/rights layers that belong to the blockchain and backend services rather than the ML service.

### Layer 1: Cryptographic Fingerprinting (MVP scope)
Will generate cryptographic hash fingerprints of artwork using SHA-256 with metadata binding, providing tamper-evident proof of authenticity and integrity verification without storing full images.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer01_fingerprint/`

### Layer 2: Steganographic Watermarking (MVP scope)
Will embed invisible watermarks into image pixel data using LSB steganography, intended to survive compression and minor transformations.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer02_steganography/`

### Layer 3: Adversarial Perturbation Shield (MVP scope)
Will inject imperceptible adversarial perturbations into artwork to interfere with ML model inference while preserving visual quality.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer03_adversarial/`

### Layer 4: NFT Certificate of Authenticity (MVP scope)
Will mint NFTs representing verifiable ownership and provenance records.
**Status**: Planned · **Scaffold**: `blockchain/contracts/` (no contract implemented yet)

### Layer 5: Forgery Detection (MVP scope)
Will train a supervised ML classifier to detect forged/fake artwork based on fingerprint mismatches and visual artifacts.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer05_forgery/`

---

### Layer 6: Distributed Ownership Ledger
Will maintain a cryptographic ledger of ownership transfers and rights assignments.
**Status**: Planned · **Scaffold**: `database/schema/`, `backend/src/services/blockchain/` (not implemented)

### Layer 7: Usage Rights Token
Will implement a token-based licensing model for artwork usage, enabling royalty distribution and usage tracking.
**Status**: Planned · **Scaffold**: `blockchain/contracts/` (no contract implemented yet)

### Layer 8: Model Poisoning Injection
Will inject data poisoning triggers into artwork to corrupt downstream ML models trained on poisoned data.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer08_model_poisoning/`

### Layer 9: Backdoor Trigger Installation
Will embed hidden backdoor triggers intended to cause model misbehavior when the pattern is detected.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer09_backdoor/`

### Layer 10: Feature Space Poisoning
Will poison learned feature representations in embedding spaces to degrade transfer learning quality.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer10_feature_poisoning/`

### Layer 11: Gradient-Based Adversarial Contamination
Will use gradient-based optimization to generate adversarial samples intended to maximize model loss when trained on the data.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer11_gradient_poisoning/`

### Layer 12: Data Poisoning Signature
Will create a signature of poisoning artifacts detectable in model weights post-training.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer12_poison_signature/`

### Layer 13: Model Inversion Defense
Will aim to prevent extraction of training data from trained models through differential privacy and gradient clipping.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer13_model_inversion/`

### Layer 14: Prompt Injection Vaccine
Will inject adversarial prompts and jailbreak-resistant examples into training data to make downstream models more resistant to prompt injection attacks.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer14_prompt_vaccine/`

### Layer 15: Polyglot Bomb Detection
Will detect and analyze malicious polyglot files (e.g., image + executable) and embedded malware signatures.
**Status**: Planned · **Scaffold**: `ml-service/app/layers/layer15_polyglot/`

## Repository Structure

This reflects the current Phase 0 scaffold. Directories exist as structural placeholders for planned code unless otherwise noted.

```
ArtShield/
├── frontend/                       # Frontend application (scaffolded)
│
├── backend/                        # Node/Express API (scaffolded)
│   └── src/
│       ├── server.ts               # Entry point
│       ├── app.ts                  # App/middleware wiring
│       ├── config/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       │   ├── pipeline/
│       │   ├── blockchain/
│       │   ├── ipfs/
│       │   └── storage/
│       ├── middleware/
│       ├── models/
│       ├── utils/
│       └── websocket/
│
├── ml-service/                     # FastAPI ML service (scaffolded)
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── layers/                 # 15-layer implementation targets (see above)
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── blockchain/                     # Solidity / Hardhat project (scaffolded)
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── deployments/
│   ├── abi/
│   ├── package.json
│   └── hardhat.config.ts
│
├── database/                       # Schema and migrations (scaffolded)
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── ipfs/                           # IPFS integration (scaffolded)
│
├── docs/                           # Project documentation
│
├── tests/                          # Cross-service / integration tests (scaffolded)
│
├── scripts/                        # Dev and maintenance scripts (scaffolded)
│
├── docker/                         # Container build files
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   ├── ml-service.Dockerfile
│   └── nginx.conf
│
├── data/                           # Local/runtime data (gitignored)
│
├── logs/                           # Runtime logs (gitignored)
│
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml              # Currently: PostgreSQL + Redis only
├── README.md
└── LICENSE
```

Note: `ml-service/Dockerfile` (under the ML service itself) and `docker/ml-service.Dockerfile` (under the shared `docker/` directory) both exist in the current scaffold; consolidation of build files is a future cleanup item, not yet resolved.

## Development Strategy

### MVP Phase (Layers 1–5) — not started
**Objective**: Core protection and detection
**Planned deliverables**:
- Cryptographic fingerprinting + verification
- Steganographic watermarking + extraction
- Adversarial perturbation injection
- NFT certificate minting
- Forgery detection classifier
- End-to-end web interface

### Phase 2: Distributed Rights (Layers 6–7) — not started
- Ownership ledger implementation
- Usage rights token smart contracts
- License management UI
- Royalty distribution logic

### Phase 3: Poisoning Mechanisms (Layers 8–12) — not started
- Model poisoning injection (targeted, feature space, gradient-based)
- Backdoor trigger installation
- Poisoning signature generation
- Adversarial contamination metrics

### Phase 4: Advanced Defenses (Layers 13–15) — not started
- Model inversion defense (differential privacy)
- Prompt injection vaccines
- Polyglot bomb detection

## Environment Configuration

Configuration is intended to be defined in `.env`, based on `.env.example` at the repository root. As of Phase 0, only the values needed to run PostgreSQL and Redis via `docker-compose.yml` are relevant; application-level variables (JWT secrets, blockchain RPC keys, IPFS/Pinata keys, etc.) are placeholders for future phases and are not consumed by any running service yet.

## Prerequisites

- **Node.js 18+** (frontend & backend, once implemented)
- **Python 3.9+** (ML service, once implemented)
- **Docker & Docker Compose** (for the current PostgreSQL + Redis dev infrastructure)
- **Git**

Blockchain tooling (Hardhat) and a local Ethereum node are only relevant once contract development begins; the local RPC (`http://localhost:8545`) is not running in Phase 0.

## Local Development

At Phase 0, the only component that can actually be started is the shared development infrastructure (PostgreSQL and Redis).

### Start development infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### Application services

`frontend/`, `backend/`, and `ml-service/` are scaffolded directory structures. They do not yet contain a runnable application, so there are no working `npm run dev` or `uvicorn` commands to document at this stage. Once each service has a minimal implementation, its own startup instructions (targeting ports 5173, 3000, and 8000 respectively) will be added here.

### Blockchain

`blockchain/` contains a Hardhat project skeleton (`hardhat.config.ts`, `package.json`, and empty `contracts/`, `scripts/`, `test/`, `deployments/`, `abi/` directories). No contracts are written yet, so there is nothing to compile, test, or deploy at this stage.

## Testing

`ml-service/tests/` and the root `tests/` directory exist as scaffolds for future unit and integration tests. `blockchain/test/` exists as a scaffold for future Hardhat contract tests. No test suites currently exist in any of these directories.

## Docker

The current scaffold includes:
- Root `docker-compose.yml` — provides the Phase 0 development infrastructure: **PostgreSQL and Redis only**. It does not currently define or run frontend, backend, ML service, or blockchain containers.
- `docker/frontend.Dockerfile`, `docker/backend.Dockerfile`, `docker/ml-service.Dockerfile` — Dockerfile scaffolds for their respective services, not yet wired into `docker-compose.yml`.
- `docker/nginx.conf` — reverse proxy configuration scaffold, not yet in use.
- `ml-service/Dockerfile` — an additional Dockerfile scaffold within the ML service itself.

To start what currently runs:

```bash
docker compose up -d
```

Building or running the per-service Dockerfiles under `docker/` is not yet supported end-to-end, since the applications they would containerize are not implemented.

## Security Design Principles

The following are intended principles for each component once implemented. They describe design intent, not a current security posture, since no application code exists yet.

### Code Security (planned)
- Server-side input validation
- Parameterized queries via ORM
- CSP headers and output escaping
- Rate limiting on API endpoints
- JWT-based authentication with token refresh

### Cryptographic Security (planned)
- SHA-256/HMAC-based fingerprinting
- LSB steganography with a watermark key
- Private keys never stored in code or version control
- Secrets loaded from `.env`, excluded from version control via `.gitignore`

### Data Protection (planned)
- Password hashing with a salted algorithm
- TLS/HTTPS in production
- CORS restricted to approved origins
- Encryption of sensitive fields at rest
- Audit logging of critical actions to `logs/`

### ML Security (planned)
- Model poisoning designed to corrupt unauthorized training
- Adversarial robustness testing against known attack classes
- Backdoor/trigger detection mechanisms
- Differential privacy considerations for Layer 13

## Future Expansion

These are directional goals for after the MVP, not commitments or scheduled releases.

- Complete the full 15-layer architecture
- Explore NFT marketplace and blockchain network integrations
- Explore AI marketplace integrations and creator verification (KYC)
- Explore decentralized governance and multi-signature wallet support
- Explore privacy-preserving verification (ZK-proofs) and cross-chain interoperability
- Consider international legal compliance requirements (DMCA, GDPR) as the platform matures

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature description"`
4. Push to your branch and open a Pull Request

### Code Standards
- Follow the project's linting/formatting configuration once established
- Write unit tests for new functionality as test infrastructure comes online
- Document non-obvious logic with comments
- Use clear, descriptive commit messages

## License

ArtShield is released under the **MIT License**. See `LICENSE` for details.

## Disclaimer

**ArtShield is a cybersecurity research and protection project.** Its adversarial and data-poisoning mechanisms, once implemented, are intended solely for protecting an artist's own artwork and for legitimate research. Users will be responsible for:
- Complying with all applicable laws and regulations
- Obtaining necessary permissions before applying protection mechanisms to others' artwork
- Using poisoning or adversarial mechanisms only on data they own or are authorized to protect
- Respecting the intellectual property rights of others

Using data poisoning or adversarial techniques against third-party systems without authorization may violate computer fraud laws. ArtShield is intended for protecting your own artwork and for research purposes only.