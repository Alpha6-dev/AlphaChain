'use strict';

const db = require('./pool');
const logger = require('../utils/logger');

async function syncShipment(shipmentData) {
  try {
    await db.query(
      `INSERT INTO shipments (shipment_id, origin, destination, goods_description, supplier_id, buyer_id, payment_amount, status, payment_released, created_at, updated_at, raw_ledger)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (shipment_id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_released = EXCLUDED.payment_released,
         updated_at = EXCLUDED.updated_at,
         raw_ledger = EXCLUDED.raw_ledger`,
      [
        shipmentData.shipmentId,
        shipmentData.origin,
        shipmentData.destination,
        shipmentData.goodsDescription,
        shipmentData.supplierId,
        shipmentData.buyerId,
        shipmentData.paymentAmount,
        shipmentData.status,
        shipmentData.paymentReleased || false,
        shipmentData.createdAt,
        shipmentData.updatedAt,
        JSON.stringify(shipmentData),
      ]
    );

    if (shipmentData.events && shipmentData.events.length > 0) {
      const latestEvent = shipmentData.events[shipmentData.events.length - 1];
      await db.query(
        `INSERT INTO shipment_events (shipment_id, status, location, actor, notes, timestamp)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (
           SELECT 1 FROM shipment_events
           WHERE shipment_id = $1 AND status = $2 AND timestamp = $6
         )`,
        [
          shipmentData.shipmentId,
          latestEvent.status,
          latestEvent.location || null,
          JSON.stringify(latestEvent.actor || {}),
          latestEvent.notes || null,
          latestEvent.timestamp,
        ]
      );
    }

    logger.debug('Shipment synced to PostgreSQL', { shipmentId: shipmentData.shipmentId });
  } catch (err) {
    logger.error('Failed to sync shipment to PostgreSQL', {
      shipmentId: shipmentData.shipmentId,
      error: err.message,
    });
  }
}

module.exports = { syncShipment };
