#!/bin/bash
# Deploy ACT token chaincode to the AlphaChain Fabric network
# Usage: ./deploy-token.sh [version] [sequence]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec "$SCRIPT_DIR/deploy-chaincode.sh" \
  "alphachain-token" \
  "${1:-1.0}" \
  "${2:-1}" \
  "/opt/gopath/src/github.com/hyperledger/fabric-samples/token"
