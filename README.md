# AlphaChain

Blockchain logistics platform for West Africa — built on Hyperledger Fabric 2.5.

Alpha 6 | Dakar, Senegal

## What this repo contains

AlphaChain provides end-to-end shipment lifecycle tracking on an immutable ledger, plus:

- auto-release payment when delivery is confirmed by an authorized party
- a utility token (ACT) for transaction fees / incentives
- an off-chain index (PostgreSQL) to power API + dashboard search
- a React dashboard for stakeholders

Phase 1 pilot: China → Dakar athletic gear import.

## Architecture

```
alphachain/
  chaincode/     Fabric smart contracts (shipment + ACT token, Node.js chaincode)
  api/           Node.js + Express REST API
  dashboard/     React 18 + Tailwind CSS stakeholder dashboard
  network/       Fabric network config (docker-compose + scripts)
  token/         AlphaChain Token (ACT) chaincode
```

## Modules (high level)

### chaincode/
Node.js Fabric chaincode (see `chaincode/README.md`):

- CreateShipment — register a new shipment
- UpdateShipmentStatus — update shipment status with custody change events
- ConfirmDelivery — mark delivered; triggers payment release
- GetShipment / GetShipmentHistory

### token/
Node.js token chaincode using the Hyperledger Fabric Token SDK (see `token/README.md`):

- ACT utility token (AlphaChain Token)
- Mint / Transfer / BalanceOf

### api/
Express REST API bridging the chaincode to web clients (see `api/README.md`):

- wallet-based Fabric client (`FABRIC_WALLET_PATH`)
- uses `connection-profile.json` + `FABRIC_MSP_ID`
- rate limiting + structured logging

Key endpoints (most used by the dashboard):

- POST /api/shipments
- GET /api/shipments/:id
- PUT /api/shipments/:id/status
- POST /api/shipments/:id/confirm
- GET /api/shipments/:id/history
- GET /api/shipments/:id/qrcode

### dashboard/
React stakeholder dashboard consuming the API; shows shipment list, detail, status timeline, and QR code scanning info. Configure API base URL via environment.

### network/
Hyperledger Fabric 2.5 dev network (see `network/README.md`):

- Orgs: AlphaOrg (MSP: AlphaOrgMSP), CustomsOrg (MSP: CustomsOrgMSP)
- Orderer: Raft
- Channel: alphachannel
- State DB: CouchDB

Scripts:

- network/scripts/start-network.sh
- network/scripts/stop-network.sh

## Prerequisites

- Docker + Docker Compose
- Node.js 20+ and npm
- (Optional) Fabric CA client tools

## Quick start (local dev)

1) Clone and install deps

```
git clone https://github.com/Alpha6-dev/AlphaChain.git
cd AlphaChain
```

2) Configure environment

- Copy `.env.example` → `.env`
- Copy `api/.env.example` → `api/.env`

Change **all secrets** before any shared deployment:

- JWT_SECRET / JWT_EXP_IN
- DB passwords
- Fabric CA URL / connection profile / wallet path

Default API port is **3001**.

3) Start the Fabric network

```
./network/scripts/start-network.sh
```

4) Run the API

```
cd api
npm install
npm run dev
```

5) Run the dashboard

```
cd ../dashboard
npm install
npm run dev
```

## Typical shipment flow

1) Origin creates shipment (AlphaOrg)
2) Custody checkpoints update shipment status
3) Authorized party confirms delivery
4) Payment release event triggers
5) Dashboard shows proof + history

## Security & roles

- Chaincode enforces access control via MSP IDs and wallet identities
- Use separate wallets per organization (see `api/.env.example`)

## Troubleshooting

- Stop + restart network to recover from container failures
- If wallet/connection profile mismatch, verify `FABRIC_CONNECTION_PROFILE`
- Fix port conflicts by changing `PORT` in `api/.env`

## Roadmap

- TLS everywhere + k8s deployment
- More stakeholders (port operator, airline, warehouse)
- Analytics dashboards + audit exports
- ACT fee modeling and mint/burn controls
