# AlphaChain API

Node.js + Express REST API connecting to the Hyperledger Fabric network.

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/shipments | Create a new shipment |
| GET | /api/shipments/:id | Get shipment details |
| PUT | /api/shipments/:id/status | Update shipment status |
| POST | /api/shipments/:id/confirm | Confirm delivery |
| GET | /api/shipments/:id/history | Get shipment event history |
| GET | /api/shipments/:id/qrcode | Generate QR code for shipment |

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required configuration.
