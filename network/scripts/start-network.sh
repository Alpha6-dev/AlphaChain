#!/bin/bash
# AlphaChain Network — Start Script
# Generates crypto material, creates channel artifacts, and starts the network

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
CHANNEL_NAME="alphachannel"

echo "========================================="
echo "  AlphaChain Network — Starting"
echo "========================================="

# Step 1: Generate crypto material
echo "[1/4] Generating crypto material..."
cryptogen generate --config="$NETWORK_DIR/crypto-config/crypto-config.yaml" \
  --output="$NETWORK_DIR/crypto-config"

# Step 2: Generate genesis block
echo "[2/4] Generating genesis block..."
configtxgen -profile AlphaChainGenesis \
  -outputBlock "$NETWORK_DIR/channel-artifacts/genesis.block" \
  -channelID system-channel \
  -configPath "$NETWORK_DIR/channel-artifacts"

# Step 3: Generate channel transaction
echo "[3/4] Generating channel transaction..."
configtxgen -profile AlphaChannel \
  -outputCreateChannelTx "$NETWORK_DIR/channel-artifacts/${CHANNEL_NAME}.tx" \
  -channelID "$CHANNEL_NAME" \
  -configPath "$NETWORK_DIR/channel-artifacts"

# Step 4: Start containers
echo "[4/4] Starting Docker containers..."
docker-compose -f "$NETWORK_DIR/docker/docker-compose.yaml" up -d

echo ""
echo "========================================="
echo "  AlphaChain Network is running!"
echo "  Channel: $CHANNEL_NAME"
echo "========================================="
