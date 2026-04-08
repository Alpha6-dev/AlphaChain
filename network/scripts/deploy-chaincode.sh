#!/bin/bash
# Deploy chaincode to the AlphaChain Fabric network
# Usage: ./deploy-chaincode.sh [chaincode_name] [version] [sequence]
#   or via CLI container: docker exec alphachain-cli bash scripts/deploy-chaincode.sh

set -e

CC_NAME="${1:-alphachain-shipment}"
CC_VERSION="${2:-1.0}"
CC_SEQUENCE="${3:-1}"
CC_SRC_PATH="${4:-/opt/gopath/src/github.com/hyperledger/fabric-samples/chaincode}"
CHANNEL_NAME="alphachannel"

ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/alphachain.com/orderers/orderer.alphachain.com/msp/tlscacerts/tlsca.alphachain.com-cert.pem"

# Peer connection vars for AlphaOrg
ALPHA_PEER="peer0.alpha.alphachain.com:7051"
ALPHA_MSP="AlphaOrgMSP"
ALPHA_TLS_CERT="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/alpha.alphachain.com/peers/peer0.alpha.alphachain.com/tls/ca.crt"
ALPHA_MSP_CONFIG="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/alpha.alphachain.com/users/Admin@alpha.alphachain.com/msp"

# Peer connection vars for CustomsOrg
CUSTOMS_PEER="peer0.customs.alphachain.com:9051"
CUSTOMS_MSP="CustomsOrgMSP"
CUSTOMS_TLS_CERT="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.alphachain.com/peers/peer0.customs.alphachain.com/tls/ca.crt"
CUSTOMS_MSP_CONFIG="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/customs.alphachain.com/users/Admin@customs.alphachain.com/msp"

echo "============================================="
echo "  Deploying chaincode: $CC_NAME v$CC_VERSION"
echo "  Channel: $CHANNEL_NAME | Sequence: $CC_SEQUENCE"
echo "============================================="

# --- Step 1: Package chaincode ---
echo ""
echo ">>> Step 1: Packaging chaincode..."
peer lifecycle chaincode package "${CC_NAME}.tar.gz" \
  --path "$CC_SRC_PATH" \
  --lang node \
  --label "${CC_NAME}_${CC_VERSION}"
echo "    Packaged: ${CC_NAME}.tar.gz"

# --- Step 2: Install on AlphaOrg peer ---
echo ""
echo ">>> Step 2: Installing on AlphaOrg (peer0.alpha)..."
export CORE_PEER_ADDRESS="$ALPHA_PEER"
export CORE_PEER_LOCALMSPID="$ALPHA_MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$ALPHA_TLS_CERT"
export CORE_PEER_MSPCONFIGPATH="$ALPHA_MSP_CONFIG"

peer lifecycle chaincode install "${CC_NAME}.tar.gz"
echo "    Installed on AlphaOrg"

# --- Step 3: Install on CustomsOrg peer ---
echo ""
echo ">>> Step 3: Installing on CustomsOrg (peer0.customs)..."
export CORE_PEER_ADDRESS="$CUSTOMS_PEER"
export CORE_PEER_LOCALMSPID="$CUSTOMS_MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$CUSTOMS_TLS_CERT"
export CORE_PEER_MSPCONFIGPATH="$CUSTOMS_MSP_CONFIG"

peer lifecycle chaincode install "${CC_NAME}.tar.gz"
echo "    Installed on CustomsOrg"

# --- Step 4: Get package ID ---
echo ""
echo ">>> Step 4: Querying installed chaincode..."
export CORE_PEER_ADDRESS="$ALPHA_PEER"
export CORE_PEER_LOCALMSPID="$ALPHA_MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$ALPHA_TLS_CERT"
export CORE_PEER_MSPCONFIGPATH="$ALPHA_MSP_CONFIG"

PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep "${CC_NAME}_${CC_VERSION}" | awk -F'[, ]+' '{print $3}')
echo "    Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ]; then
  echo "ERROR: Could not find package ID for ${CC_NAME}_${CC_VERSION}"
  exit 1
fi

# --- Step 5: Approve for AlphaOrg ---
echo ""
echo ">>> Step 5: Approving for AlphaOrg..."
peer lifecycle chaincode approveformyorg \
  -o orderer.alphachain.com:7050 \
  --tls --cafile "$ORDERER_CA" \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --package-id "$PACKAGE_ID" \
  --sequence "$CC_SEQUENCE"
echo "    Approved for AlphaOrg"

# --- Step 6: Approve for CustomsOrg ---
echo ""
echo ">>> Step 6: Approving for CustomsOrg..."
export CORE_PEER_ADDRESS="$CUSTOMS_PEER"
export CORE_PEER_LOCALMSPID="$CUSTOMS_MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$CUSTOMS_TLS_CERT"
export CORE_PEER_MSPCONFIGPATH="$CUSTOMS_MSP_CONFIG"

peer lifecycle chaincode approveformyorg \
  -o orderer.alphachain.com:7050 \
  --tls --cafile "$ORDERER_CA" \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --package-id "$PACKAGE_ID" \
  --sequence "$CC_SEQUENCE"
echo "    Approved for CustomsOrg"

# --- Step 7: Check commit readiness ---
echo ""
echo ">>> Step 7: Checking commit readiness..."
export CORE_PEER_ADDRESS="$ALPHA_PEER"
export CORE_PEER_LOCALMSPID="$ALPHA_MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$ALPHA_TLS_CERT"
export CORE_PEER_MSPCONFIGPATH="$ALPHA_MSP_CONFIG"

peer lifecycle chaincode checkcommitreadiness \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --sequence "$CC_SEQUENCE" \
  --output json

# --- Step 8: Commit chaincode ---
echo ""
echo ">>> Step 8: Committing chaincode definition..."
peer lifecycle chaincode commit \
  -o orderer.alphachain.com:7050 \
  --tls --cafile "$ORDERER_CA" \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --version "$CC_VERSION" \
  --sequence "$CC_SEQUENCE" \
  --peerAddresses "$ALPHA_PEER" \
  --tlsRootCertFiles "$ALPHA_TLS_CERT" \
  --peerAddresses "$CUSTOMS_PEER" \
  --tlsRootCertFiles "$CUSTOMS_TLS_CERT"
echo "    Committed!"

# --- Step 9: Verify ---
echo ""
echo ">>> Step 9: Verifying committed chaincode..."
peer lifecycle chaincode querycommitted \
  --channelID "$CHANNEL_NAME" \
  --name "$CC_NAME" \
  --output json

echo ""
echo "============================================="
echo "  Chaincode $CC_NAME v$CC_VERSION deployed!"
echo "============================================="
