# AlphaChain

**Blockchain logistics platform for West Africa** — built on Hyperledger Fabric 2.5.

Alpha 6 | Dakar, Senegal

---

## Overview

AlphaChain provides end-to-end shipment tracking on an immutable ledger, with auto-release payments on delivery confirmation and a utility token (ACT) for transaction fees.

**Phase 1 Pilot**: China to Dakar athletic gear import.

## Architecture

```
alphachain/
  chaincode/     Fabric smart contracts (shipment lifecycle)
  api/           Node.js + Express REST API (fabric-network SDK)
  dashboard/     React 18 + Tailwind CSS stakeholder dashboard
  network/       Fabric network config (docker-compose, crypto, channels)
  token/         AlphaChain Token (ACT) chaincode
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Hyperledger Fabric 2.5 |
| Smart Contracts | JavaScript (fabric-contract-api) |
| Backend | Node.js + Express + fabric-network SDK |
| Frontend | React 18 + Tailwind CSS + Recharts |
| Database | PostgreSQL (off-chain metadata) |
| Infrastructure | Docker + docker-compose |

## Network Topology

- **Organizations**: AlphaOrg (MSP: AlphaOrgMSP), CustomsOrg (MSP: CustomsOrgMSP)
- **Orderer**: orderer.alphachain.com (Raft consensus)
- **Channel**: alphachannel
- **State DB**: CouchDB (rich queries)

## Quick Start

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start the Fabric network
cd network/scripts
./start-network.sh

# 3. Deploy chaincode
./deploy-chaincode.sh

# 4. Start the API server
cd ../../api
npm install
npm run dev

# 5. Start the dashboard
cd ../dashboard
npm install
npm run dev
```

## Core Features

- **Shipment lifecycle tracking** — Create, update, complete shipment events on ledger
- **Immutable event log** — Every custody change recorded on-chain
- **Auto-release payment** — Smart contract releases payment on verified delivery confirmation
- **QR code tracking** — Each shipment gets a unique QR code
- **Role-based access** — Supplier / Transporter / Buyer / Customs / Admin
- **AlphaChain Token (ACT)** — Utility token for platform transaction fees

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/shipments | Create a new shipment |
| GET | /api/shipments/:id | Get shipment details |
| PUT | /api/shipments/:id/status | Update shipment status |
| POST | /api/shipments/:id/confirm | Confirm delivery (releases payment) |
| GET | /api/shipments/:id/history | Get shipment ledger history |
| GET | /api/shipments/:id/qrcode | Generate tracking QR code |

## Roles

| Role | Permissions |
|------|------------|
| Supplier | Create shipments, update status |
| Transporter | Update shipment status, custody events |
| Buyer | Confirm delivery (triggers payment release) |
| Customs | Customs hold/clearance actions |
| Admin | Full access |

## License

Proprietary — Alpha 6, Dakar, Senegal
