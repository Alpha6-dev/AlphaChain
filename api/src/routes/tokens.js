'use strict';

const express = require('express');
const { getContract } = require('../utils/fabricClient');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

/**
 * GET /api/tokens/balance/:account
 * Get ACT token balance for an account.
 */
router.get('/balance/:account', async (req, res, next) => {
  try {
    const contract = await getContract('alphachain-token');
    const result = await contract.evaluateTransaction('BalanceOf', req.params.account);
    const data = JSON.parse(result.toString());
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tokens/transfer
 * Transfer ACT tokens.
 */
router.post('/transfer', async (req, res, next) => {
  try {
    const { recipient, amount } = req.body;

    if (!recipient || !amount) {
      const err = new Error('Missing required fields: recipient, amount');
      err.statusCode = 400;
      throw err;
    }

    const contract = await getContract('alphachain-token');
    const result = await contract.submitTransaction('Transfer', recipient, amount.toString());
    const data = JSON.parse(result.toString());
    logger.info('Token transfer', { recipient, amount });

    res.json({ success: true, data });
  } catch (err) {
    if (err.message.includes('Insufficient')) {
      err.statusCode = 400;
    }
    next(err);
  }
});

/**
 * GET /api/tokens/info
 * Get token metadata (name, symbol, total supply).
 */
router.get('/info', async (req, res, next) => {
  try {
    const contract = await getContract('alphachain-token');
    const [name, symbol, supply] = await Promise.all([
      contract.evaluateTransaction('TokenName'),
      contract.evaluateTransaction('TokenSymbol'),
      contract.evaluateTransaction('TotalSupply'),
    ]);

    res.json({
      success: true,
      data: {
        name: name.toString(),
        symbol: symbol.toString(),
        ...JSON.parse(supply.toString()),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tokens/escrow/:shipmentId
 * Get escrow balance for a shipment.
 */
router.get('/escrow/:shipmentId', async (req, res, next) => {
  try {
    const contract = await getContract('alphachain-token');
    const result = await contract.evaluateTransaction('EscrowBalance', req.params.shipmentId);
    const data = JSON.parse(result.toString());
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
