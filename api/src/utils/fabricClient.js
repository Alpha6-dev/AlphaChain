'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('./logger');

let gateway = null;
let network = null;
const contracts = {};

/**
 * Connect to the Fabric network and return a contract.
 * @param {string} [chaincodeName] - Optional chaincode name. Defaults to config.fabric.chaincodeName.
 */
async function getContract(chaincodeName) {
  const ccName = chaincodeName || config.fabric.chaincodeName;

  if (contracts[ccName]) {
    return contracts[ccName];
  }

  // Connect gateway if not connected
  if (!gateway) {
    const ccpPath = path.resolve(config.fabric.connectionProfile);
    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile not found at ${ccpPath}`);
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.resolve(config.fabric.walletPath);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('appUser');
    if (!identity) {
      throw new Error(
        'Identity "appUser" not found in wallet. Run the enrollment script first.'
      );
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true },
    });

    network = await gateway.getNetwork(config.fabric.channelName);
  }

  contracts[ccName] = network.getContract(ccName);

  logger.info('Connected to Fabric contract', {
    channel: config.fabric.channelName,
    chaincode: ccName,
  });

  return contracts[ccName];
}

/**
 * Disconnect from the Fabric network.
 */
async function disconnect() {
  if (gateway) {
    await gateway.disconnect();
    gateway = null;
    network = null;
    Object.keys(contracts).forEach(k => delete contracts[k]);
    logger.info('Disconnected from Fabric network');
  }
}

module.exports = { getContract, disconnect };
