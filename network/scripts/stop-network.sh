#!/bin/bash
# AlphaChain Network — Stop Script

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stopping AlphaChain network..."
docker-compose -f "$NETWORK_DIR/docker/docker-compose.yaml" down --volumes --remove-orphans

echo "Cleaning up generated crypto material..."
rm -rf "$NETWORK_DIR/crypto-config/ordererOrganizations"
rm -rf "$NETWORK_DIR/crypto-config/peerOrganizations"
rm -f "$NETWORK_DIR/channel-artifacts/genesis.block"
rm -f "$NETWORK_DIR/channel-artifacts/alphachannel.tx"

echo "AlphaChain network stopped and cleaned up."
