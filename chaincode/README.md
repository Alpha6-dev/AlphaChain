# AlphaChain Chaincode

Hyperledger Fabric smart contracts for the AlphaChain logistics platform.

## Functions

- `CreateShipment` — Register a new shipment on the ledger
- `UpdateShipmentStatus` — Update shipment status with custody change events
- `ConfirmDelivery` — Mark shipment as delivered, triggers payment release
- `GetShipment` — Query a shipment by ID
- `GetShipmentHistory` — Retrieve full event history for a shipment

## Development

```bash
npm install
npm test
```

## Deployment

Chaincode is deployed to the Fabric network via the peer lifecycle commands.
See `/network/scripts/deploy-chaincode.sh` for automated deployment.
