'use strict';

const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { getContract } = require('../utils/fabricClient');
const logger = require('../utils/logger');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

/**
 * POST /api/shipments
 * Create a new shipment on the ledger.
 */
router.post('/', authorize('supplier', 'admin'), async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      goodsDescription,
      supplierId,
      buyerId,
      paymentAmount,
    } = req.body;

    if (!origin || !destination || !goodsDescription || !supplierId || !buyerId || !paymentAmount) {
      const err = new Error('Missing required fields: origin, destination, goodsDescription, supplierId, buyerId, paymentAmount');
      err.statusCode = 400;
      throw err;
    }

    const shipmentId = `SHIP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const contract = await getContract();

    const result = await contract.submitTransaction(
      'CreateShipment',
      shipmentId,
      origin,
      destination,
      goodsDescription,
      supplierId,
      buyerId,
      paymentAmount.toString()
    );

    const shipment = JSON.parse(result.toString());
    logger.info('Shipment created', { shipmentId });

    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shipments/:id
 * Retrieve a shipment by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction('GetShipment', req.params.id);
    const shipment = JSON.parse(result.toString());

    res.json({ success: true, data: shipment });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      err.statusCode = 404;
    }
    next(err);
  }
});

/**
 * PUT /api/shipments/:id/status
 * Update shipment status with a custody change event.
 */
router.put('/:id/status', authorize('supplier', 'transporter', 'customs', 'port_operator', 'airline', 'warehouse', 'admin'), async (req, res, next) => {
  try {
    const { status, location, notes } = req.body;

    if (!status || !location) {
      const err = new Error('Missing required fields: status, location');
      err.statusCode = 400;
      throw err;
    }

    const contract = await getContract();
    const result = await contract.submitTransaction(
      'UpdateShipmentStatus',
      req.params.id,
      status,
      location,
      notes || ''
    );

    const shipment = JSON.parse(result.toString());
    logger.info('Shipment status updated', { shipmentId: req.params.id, status });

    res.json({ success: true, data: shipment });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      err.statusCode = 404;
    } else if (err.message.includes('Invalid status transition')) {
      err.statusCode = 400;
    }
    next(err);
  }
});

/**
 * POST /api/shipments/:id/confirm
 * Confirm delivery — triggers payment release.
 */
router.post('/:id/confirm', authorize('buyer', 'admin'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const contract = await getContract();

    const result = await contract.submitTransaction(
      'ConfirmDelivery',
      req.params.id,
      notes || ''
    );

    const shipment = JSON.parse(result.toString());
    logger.info('Delivery confirmed, payment released', { shipmentId: req.params.id });

    res.json({ success: true, data: shipment });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      err.statusCode = 404;
    } else if (err.message.includes('must be in DELIVERED')) {
      err.statusCode = 400;
    }
    next(err);
  }
});

/**
 * GET /api/shipments/:id/history
 * Get the full ledger history for a shipment.
 */
router.get('/:id/history', async (req, res, next) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction('GetShipmentHistory', req.params.id);
    const history = JSON.parse(result.toString());

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shipments/:id/qrcode
 * Generate a QR code PNG for the shipment tracking URL.
 */
router.get('/:id/qrcode', async (req, res, next) => {
  try {
    // Verify shipment exists
    const contract = await getContract();
    await contract.evaluateTransaction('GetShipment', req.params.id);

    const trackingUrl = `${req.protocol}://${req.get('host')}/api/shipments/${req.params.id}`;
    const qrBuffer = await QRCode.toBuffer(trackingUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    res.set('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err) {
    if (err.message.includes('does not exist')) {
      err.statusCode = 404;
    }
    next(err);
  }
});

module.exports = router;
