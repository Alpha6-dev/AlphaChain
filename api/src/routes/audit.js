'use strict';

const express = require('express');
const db = require('../db/pool');
const { getContract } = require('../utils/fabricClient');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

/**
 * GET /api/audit/export
 * Export shipment events as CSV or JSON.
 * Query params: format (csv|json), from, to
 */
router.get('/export', authorize('admin'), async (req, res, next) => {
  try {
    const { format = 'json', from, to } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (from) {
      conditions.push(`se.timestamp >= $${paramIndex++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`se.timestamp <= $${paramIndex++}`);
      params.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT se.shipment_id, se.status, se.location, se.actor, se.notes, se.timestamp,
              s.origin, s.destination, s.goods_description, s.payment_amount, s.payment_released
       FROM shipment_events se
       JOIN shipments s ON se.shipment_id = s.shipment_id
       ${where}
       ORDER BY se.timestamp ASC`,
      params
    );

    if (format === 'csv') {
      const header = 'shipment_id,status,location,actor_org,notes,timestamp,origin,destination,goods,payment_amount,payment_released\n';
      const rows = result.rows.map(r => {
        const actor = typeof r.actor === 'string' ? JSON.parse(r.actor) : r.actor;
        return [
          r.shipment_id,
          r.status,
          `"${(r.location || '').replace(/"/g, '""')}"`,
          actor?.mspId || '',
          `"${(r.notes || '').replace(/"/g, '""')}"`,
          r.timestamp,
          `"${r.origin}"`,
          `"${r.destination}"`,
          `"${(r.goods_description || '').replace(/"/g, '""')}"`,
          r.payment_amount,
          r.payment_released,
        ].join(',');
      }).join('\n');

      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename=alphachain-audit-${new Date().toISOString().slice(0, 10)}.csv`);
      res.send(header + rows);
    } else {
      res.json({ success: true, data: result.rows, count: result.rows.length });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/audit/ledger-proof/:shipmentId
 * Full Fabric ledger history with transaction IDs for cryptographic proof.
 */
router.get('/ledger-proof/:shipmentId', async (req, res, next) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction('GetShipmentHistory', req.params.shipmentId);
    const history = JSON.parse(result.toString());

    res.json({
      success: true,
      data: {
        shipmentId: req.params.shipmentId,
        ledgerHistory: history,
        proofCount: history.length,
        channel: 'alphachannel',
      },
    });
  } catch (err) {
    if (err.message.includes('does not exist')) {
      err.statusCode = 404;
    }
    next(err);
  }
});

module.exports = router;
