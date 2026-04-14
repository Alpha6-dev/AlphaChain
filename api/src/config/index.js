'use strict';

require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  fabric: {
    channelName: process.env.FABRIC_CHANNEL_NAME || 'alphachannel',
    chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'alphachain-shipment',
    walletPath: process.env.FABRIC_WALLET_PATH || './wallet',
    connectionProfile: process.env.FABRIC_CONNECTION_PROFILE || './connection-profile.json',
    mspId: process.env.FABRIC_MSP_ID || 'AlphaOrgMSP',
    caUrl: process.env.FABRIC_CA_URL || 'https://ca.alpha.alphachain.com:7054',
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    database: process.env.POSTGRES_DB || 'alphachain',
    user: process.env.POSTGRES_USER || 'alphachain',
    password: process.env.POSTGRES_PASSWORD || 'alphachain_secret',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  invoices: {
    dataPath: process.env.INVOICE_DATA_PATH || './data/invoices.json',
    uploadPath: process.env.INVOICE_UPLOAD_PATH || './uploads/invoices',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
