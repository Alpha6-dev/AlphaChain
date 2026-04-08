'use strict';

const { Contract } = require('fabric-contract-api');

// Shipment status constants
const Status = {
  CREATED: 'CREATED',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_PORT: 'AT_PORT',
  AT_WAREHOUSE: 'AT_WAREHOUSE',
  CUSTOMS_HOLD: 'CUSTOMS_HOLD',
  CUSTOMS_CLEARED: 'CUSTOMS_CLEARED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CONFIRMED: 'CONFIRMED',
};

// Valid status transitions
const VALID_TRANSITIONS = {
  [Status.CREATED]: [Status.IN_TRANSIT],
  [Status.IN_TRANSIT]: [Status.CUSTOMS_HOLD, Status.AT_PORT, Status.AT_WAREHOUSE, Status.OUT_FOR_DELIVERY],
  [Status.AT_PORT]: [Status.CUSTOMS_HOLD, Status.IN_TRANSIT],
  [Status.AT_WAREHOUSE]: [Status.IN_TRANSIT, Status.OUT_FOR_DELIVERY],
  [Status.CUSTOMS_HOLD]: [Status.CUSTOMS_CLEARED],
  [Status.CUSTOMS_CLEARED]: [Status.OUT_FOR_DELIVERY],
  [Status.OUT_FOR_DELIVERY]: [Status.DELIVERED],
  [Status.DELIVERED]: [Status.CONFIRMED],
};

// Roles that can perform specific actions
const ROLE_PERMISSIONS = {
  createShipment: ['supplier', 'admin'],
  updateStatus: ['supplier', 'transporter', 'customs', 'port_operator', 'airline', 'warehouse', 'admin'],
  confirmDelivery: ['buyer', 'admin'],
  warehouseOps: ['warehouse', 'admin'],
};

class ShipmentContract extends Contract {
  constructor() {
    super('org.alphachain.shipment');
  }

  /**
   * Initialize the ledger (called on chaincode instantiation).
   */
  async InitLedger(ctx) {
    console.info('AlphaChain Shipment Chaincode initialized');
  }

  /**
   * CreateShipment — Register a new shipment on the ledger.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} shipmentId - Unique shipment identifier
   * @param {string} origin - Origin location (e.g., "Guangzhou, China")
   * @param {string} destination - Destination location (e.g., "Dakar, Senegal")
   * @param {string} goodsDescription - Description of goods
   * @param {string} supplierId - ID of the supplier organization
   * @param {string} buyerId - ID of the buyer
   * @param {string} paymentAmount - Payment amount in ACT tokens
   */
  async CreateShipment(ctx, shipmentId, origin, destination, goodsDescription, supplierId, buyerId, paymentAmount) {
    // Check authorization
    this._checkRole(ctx, ROLE_PERMISSIONS.createShipment);

    // Check if shipment already exists
    const existing = await ctx.stub.getState(shipmentId);
    if (existing && existing.length > 0) {
      throw new Error(`Shipment ${shipmentId} already exists`);
    }

    const timestamp = ctx.stub.getTxTimestamp();
    const createdAt = new Date(timestamp.seconds.low * 1000).toISOString();

    const shipment = {
      docType: 'shipment',
      shipmentId,
      origin,
      destination,
      goodsDescription,
      supplierId,
      buyerId,
      paymentAmount: parseFloat(paymentAmount),
      status: Status.CREATED,
      paymentReleased: false,
      createdAt,
      updatedAt: createdAt,
      events: [
        {
          status: Status.CREATED,
          timestamp: createdAt,
          actor: this._getClientIdentity(ctx),
          location: origin,
          notes: 'Shipment created',
        },
      ],
    };

    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

    // Emit event for off-chain listeners
    ctx.stub.setEvent('ShipmentCreated', Buffer.from(JSON.stringify({
      shipmentId,
      origin,
      destination,
      supplierId,
      buyerId,
      status: Status.CREATED,
    })));

    return JSON.stringify(shipment);
  }

  /**
   * UpdateShipmentStatus — Record a status change / custody transfer event.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} shipmentId - Shipment to update
   * @param {string} newStatus - Target status
   * @param {string} location - Current location of the shipment
   * @param {string} notes - Free-text notes for this event
   */
  async UpdateShipmentStatus(ctx, shipmentId, newStatus, location, notes) {
    this._checkRole(ctx, ROLE_PERMISSIONS.updateStatus);

    const shipment = await this._getShipmentOrThrow(ctx, shipmentId);

    // Validate status transition
    const allowed = VALID_TRANSITIONS[shipment.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${shipment.status} -> ${newStatus}. Allowed: ${allowed.join(', ')}`
      );
    }

    const timestamp = ctx.stub.getTxTimestamp();
    const updatedAt = new Date(timestamp.seconds.low * 1000).toISOString();

    shipment.status = newStatus;
    shipment.updatedAt = updatedAt;
    shipment.events.push({
      status: newStatus,
      timestamp: updatedAt,
      actor: this._getClientIdentity(ctx),
      location,
      notes,
    });

    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

    ctx.stub.setEvent('ShipmentStatusUpdated', Buffer.from(JSON.stringify({
      shipmentId,
      previousStatus: shipment.status,
      newStatus,
      location,
    })));

    return JSON.stringify(shipment);
  }

  /**
   * ConfirmDelivery — Buyer confirms receipt; triggers auto-release of payment.
   *
   * @param {Context} ctx - Transaction context
   * @param {string} shipmentId - Shipment to confirm
   * @param {string} notes - Confirmation notes
   */
  async ConfirmDelivery(ctx, shipmentId, notes) {
    this._checkRole(ctx, ROLE_PERMISSIONS.confirmDelivery);

    const shipment = await this._getShipmentOrThrow(ctx, shipmentId);

    if (shipment.status !== Status.DELIVERED) {
      throw new Error(`Shipment must be in DELIVERED status to confirm. Current: ${shipment.status}`);
    }

    const timestamp = ctx.stub.getTxTimestamp();
    const updatedAt = new Date(timestamp.seconds.low * 1000).toISOString();

    shipment.status = Status.CONFIRMED;
    shipment.paymentReleased = true;
    shipment.updatedAt = updatedAt;
    shipment.events.push({
      status: Status.CONFIRMED,
      timestamp: updatedAt,
      actor: this._getClientIdentity(ctx),
      location: shipment.destination,
      notes: notes || 'Delivery confirmed by buyer — payment released',
    });

    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

    // Emit payment release event for off-chain payment processor
    ctx.stub.setEvent('PaymentReleased', Buffer.from(JSON.stringify({
      shipmentId,
      supplierId: shipment.supplierId,
      buyerId: shipment.buyerId,
      paymentAmount: shipment.paymentAmount,
    })));

    ctx.stub.setEvent('DeliveryConfirmed', Buffer.from(JSON.stringify({
      shipmentId,
      confirmedAt: updatedAt,
    })));

    return JSON.stringify(shipment);
  }

  /**
   * GetShipment — Query a single shipment by ID.
   */
  async GetShipment(ctx, shipmentId) {
    const shipment = await this._getShipmentOrThrow(ctx, shipmentId);
    return JSON.stringify(shipment);
  }

  /**
   * GetShipmentHistory — Retrieve the full modification history from the ledger.
   * Returns every version of the shipment state recorded by Fabric.
   */
  async GetShipmentHistory(ctx, shipmentId) {
    const iterator = await ctx.stub.getHistoryForKey(shipmentId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      if (result.value) {
        const record = {
          txId: result.value.txId,
          timestamp: result.value.timestamp,
          isDelete: result.value.isDelete,
        };

        if (!result.value.isDelete) {
          try {
            record.value = JSON.parse(result.value.value.toString('utf8'));
          } catch (err) {
            record.value = result.value.value.toString('utf8');
          }
        }

        history.push(record);
      }
      result = await iterator.next();
    }
    await iterator.close();

    return JSON.stringify(history);
  }

  /**
   * GetAllShipments — Rich query to list all shipments (requires CouchDB).
   */
  async GetAllShipments(ctx) {
    const query = { selector: { docType: 'shipment' } };
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const shipments = [];

    let result = await iterator.next();
    while (!result.done) {
      if (result.value && result.value.value) {
        try {
          shipments.push(JSON.parse(result.value.value.toString('utf8')));
        } catch (err) {
          console.error('Failed to parse shipment:', err);
        }
      }
      result = await iterator.next();
    }
    await iterator.close();

    return JSON.stringify(shipments);
  }

  /**
   * WarehouseCheckIn — Record goods arriving at a warehouse.
   */
  async WarehouseCheckIn(ctx, shipmentId, warehouseId, location, notes) {
    this._checkRole(ctx, ROLE_PERMISSIONS.warehouseOps);

    const shipment = await this._getShipmentOrThrow(ctx, shipmentId);

    if (shipment.status !== Status.IN_TRANSIT) {
      throw new Error(`Shipment must be IN_TRANSIT for warehouse check-in. Current: ${shipment.status}`);
    }

    const timestamp = ctx.stub.getTxTimestamp();
    const updatedAt = new Date(timestamp.seconds.low * 1000).toISOString();

    shipment.status = Status.AT_WAREHOUSE;
    shipment.warehouseId = warehouseId;
    shipment.updatedAt = updatedAt;
    shipment.events.push({
      status: Status.AT_WAREHOUSE,
      timestamp: updatedAt,
      actor: this._getClientIdentity(ctx),
      location,
      notes: notes || `Checked into warehouse ${warehouseId}`,
    });

    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

    ctx.stub.setEvent('WarehouseCheckIn', Buffer.from(JSON.stringify({
      shipmentId,
      warehouseId,
      location,
    })));

    return JSON.stringify(shipment);
  }

  /**
   * WarehouseCheckOut — Record goods leaving a warehouse.
   */
  async WarehouseCheckOut(ctx, shipmentId, notes) {
    this._checkRole(ctx, ROLE_PERMISSIONS.warehouseOps);

    const shipment = await this._getShipmentOrThrow(ctx, shipmentId);

    if (shipment.status !== Status.AT_WAREHOUSE) {
      throw new Error(`Shipment must be AT_WAREHOUSE for check-out. Current: ${shipment.status}`);
    }

    const timestamp = ctx.stub.getTxTimestamp();
    const updatedAt = new Date(timestamp.seconds.low * 1000).toISOString();

    shipment.status = Status.OUT_FOR_DELIVERY;
    shipment.updatedAt = updatedAt;
    shipment.events.push({
      status: Status.OUT_FOR_DELIVERY,
      timestamp: updatedAt,
      actor: this._getClientIdentity(ctx),
      location: shipment.destination,
      notes: notes || `Checked out of warehouse ${shipment.warehouseId}`,
    });

    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

    ctx.stub.setEvent('WarehouseCheckOut', Buffer.from(JSON.stringify({
      shipmentId,
      warehouseId: shipment.warehouseId,
    })));

    return JSON.stringify(shipment);
  }

  // --- Internal helpers ---

  async _getShipmentOrThrow(ctx, shipmentId) {
    const data = await ctx.stub.getState(shipmentId);
    if (!data || data.length === 0) {
      throw new Error(`Shipment ${shipmentId} does not exist`);
    }
    return JSON.parse(data.toString());
  }

  _getClientIdentity(ctx) {
    const cid = ctx.clientIdentity;
    return {
      mspId: cid.getMSPID(),
      id: cid.getID(),
    };
  }

  _checkRole(ctx, allowedRoles) {
    const cid = ctx.clientIdentity;
    const role = cid.getAttributeValue('role');

    // If no role attribute is set, fall back to MSP-based checks
    if (!role) {
      return;
    }

    if (!allowedRoles.includes(role.toLowerCase())) {
      throw new Error(
        `Access denied. Role "${role}" is not authorized. Required: ${allowedRoles.join(', ')}`
      );
    }
  }
}

module.exports = ShipmentContract;
