'use strict';

const express = require('express');
const db = require('../db/pool');

const router = express.Router();

/**
 * GET /api/search/shipments
 * Search/filter shipments from PostgreSQL with pagination.
 */
router.get('/shipments', async (req, res, next) => {
  try {
    const { status, supplier, buyer, q, from, to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (supplier) {
      conditions.push(`supplier_id = $${paramIndex++}`);
      params.push(supplier);
    }
    if (buyer) {
      conditions.push(`buyer_id = $${paramIndex++}`);
      params.push(buyer);
    }
    if (q) {
      conditions.push(`(shipment_id ILIKE $${paramIndex} OR goods_description ILIKE $${paramIndex} OR origin ILIKE $${paramIndex} OR destination ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }
    if (from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(from);
    }
    if (to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM shipments ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT shipment_id, origin, destination, goods_description, supplier_id, buyer_id,
              payment_amount, status, payment_released, created_at, updated_at
       FROM shipments ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/shipments/stats
 * Aggregate shipment statistics.
 */
router.get('/shipments/stats', async (req, res, next) => {
  try {
    const statusCounts = await db.query(
      `SELECT status, COUNT(*) as count FROM shipments GROUP BY status ORDER BY count DESC`
    );

    const totals = await db.query(
      `SELECT
         COUNT(*) as total_shipments,
         COALESCE(SUM(payment_amount), 0) as total_payment_value,
         COALESCE(SUM(CASE WHEN payment_released THEN payment_amount ELSE 0 END), 0) as released_payments,
         COALESCE(SUM(CASE WHEN NOT payment_released THEN payment_amount ELSE 0 END), 0) as pending_payments
       FROM shipments`
    );

    res.json({
      success: true,
      data: {
        statusDistribution: statusCounts.rows,
        ...totals.rows[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
