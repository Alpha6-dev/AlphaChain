'use strict';

const express = require('express');
const db = require('../db/pool');

const router = express.Router();

/**
 * GET /api/analytics/shipment-volume
 * Shipment creation volume over time.
 */
router.get('/shipment-volume', async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;
    let dateFormat;

    switch (period) {
      case 'weekly':
        dateFormat = 'IYYY-IW';
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const result = await db.query(
      `SELECT TO_CHAR(created_at, $1) as period, COUNT(*) as count
       FROM shipments
       GROUP BY TO_CHAR(created_at, $1)
       ORDER BY period DESC
       LIMIT 30`,
      [dateFormat]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/status-distribution
 * Current shipment count per status.
 */
router.get('/status-distribution', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT status, COUNT(*) as count FROM shipments GROUP BY status ORDER BY count DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/avg-transit-time
 * Average time from CREATED to DELIVERED (in days).
 */
router.get('/avg-transit-time', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         AVG(EXTRACT(EPOCH FROM (delivered.timestamp - created.timestamp)) / 86400) as avg_days,
         MIN(EXTRACT(EPOCH FROM (delivered.timestamp - created.timestamp)) / 86400) as min_days,
         MAX(EXTRACT(EPOCH FROM (delivered.timestamp - created.timestamp)) / 86400) as max_days,
         COUNT(*) as sample_size
       FROM shipment_events created
       JOIN shipment_events delivered ON created.shipment_id = delivered.shipment_id
       WHERE created.status = 'CREATED' AND delivered.status = 'DELIVERED'`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/payment-summary
 * Total payments, released vs pending.
 */
router.get('/payment-summary', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*) as total_shipments,
         COALESCE(SUM(payment_amount), 0) as total_value,
         COALESCE(SUM(CASE WHEN payment_released THEN payment_amount ELSE 0 END), 0) as released,
         COALESCE(SUM(CASE WHEN NOT payment_released THEN payment_amount ELSE 0 END), 0) as pending
       FROM shipments`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/top-routes
 * Most common origin-destination pairs.
 */
router.get('/top-routes', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT origin, destination, COUNT(*) as shipment_count,
              COALESCE(SUM(payment_amount), 0) as total_value
       FROM shipments
       GROUP BY origin, destination
       ORDER BY shipment_count DESC
       LIMIT 10`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/role-activity
 * Transaction counts by actor role.
 */
router.get('/role-activity', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         actor->>'mspId' as org,
         status,
         COUNT(*) as event_count
       FROM shipment_events
       GROUP BY actor->>'mspId', status
       ORDER BY event_count DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
