'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('./logger');

let gateway = null;
let network = null;
let contract = null;

/**
 * Connect to the Fabric network and return the shipment contract.
 */
async function getContract() {
  if (contract) {
    return contract;
  }

  // Load connection profile
  const ccpPath = path.resolve(config.fabric.connectionProfile);
  if (!fs.existsSync(ccpPath)) {
    throw new Error(`Connection profile not found at ${ccpPath}`);
  }
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  // Set up wallet
  const walletPath = path.resolve(config.fabric.walletPath);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  // Check for user identity
  const identity = await wallet.get('appUser');
  if (!identity) {
    throw new Error(
      'Identity "appUser" not found in wallet. Run the enrollment script first.'
    );
  }

  // Connect gateway
  gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'appUser',
    discovery: { enabled: true, asLocalhost: true },
  });

  network = await gateway.getNetwork(config.fabric.channelName);
  contract = network.getContract(config.fabric.chaincodeName);

  logger.info('Connected to Fabric network', {
    channel: config.fabric.channelName,
    chaincode: config.fabric.chaincodeName,
  });

  return contract;
}

/**
 * Disconnect from the Fabric network.
 */
async function disconnect() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    network = null;
    contract = null;
    logger.info('Disconnected from Fabric network');
  }
}

module.exports = { getContract, disconnect };
