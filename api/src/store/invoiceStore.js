'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

const dataPath = path.resolve(config.invoices.dataPath);
const dataDir = path.dirname(dataPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store, synced to disk
let invoices = [];

// Load existing data
try {
  if (fs.existsSync(dataPath)) {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    invoices = JSON.parse(raw);
    logger.info(`Loaded ${invoices.length} invoices from store`);
  }
} catch (err) {
  logger.warn('Failed to load invoice store, starting fresh', { error: err.message });
  invoices = [];
}

function persist() {
  try {
    const tmp = dataPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(invoices, null, 2));
    fs.renameSync(tmp, dataPath);
  } catch (err) {
    logger.error('Failed to persist invoice store', { error: err.message });
  }
}

function addInvoice({ filename, originalName, size, mimetype, source }) {
  const invoice = {
    id: `INV-${uuidv4().slice(0, 8).toUpperCase()}`,
    filename,
    originalName,
    size,
    mimetype,
    source: source || 'unknown',
    status: 'received',
    receivedAt: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  persist();
  logger.info('Invoice stored', { id: invoice.id, source: invoice.source });
  return invoice;
}

function getAllInvoices({ source, limit = 50, offset = 0 } = {}) {
  let filtered = invoices;
  if (source) {
    filtered = filtered.filter((inv) => inv.source === source);
  }
  const total = filtered.length;
  const data = filtered.slice(offset, offset + limit);
  return { data, total };
}

function getInvoiceById(id) {
  return invoices.find((inv) => inv.id === id) || null;
}

function getStats() {
  const bySource = {};
  const byType = {};

  for (const inv of invoices) {
    bySource[inv.source] = (bySource[inv.source] || 0) + 1;

    let typeKey = 'other';
    if (inv.mimetype === 'application/pdf') typeKey = 'pdf';
    else if (inv.mimetype.startsWith('image/')) typeKey = 'image';
    else if (inv.mimetype.includes('spreadsheet') || inv.mimetype.includes('excel')) typeKey = 'excel';
    byType[typeKey] = (byType[typeKey] || 0) + 1;
  }

  return {
    total: invoices.length,
    bySource,
    byType,
    recent: invoices.slice(0, 5),
  };
}

module.exports = { addInvoice, getAllInvoices, getInvoiceById, getStats };
