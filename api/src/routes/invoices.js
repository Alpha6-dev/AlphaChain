'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const invoiceStore = require('../store/invoiceStore');

const router = express.Router();

/**
 * GET /api/invoices
 * List invoices with optional filtering.
 */
router.get('/', (req, res) => {
  const source = req.query.source || undefined;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;

  const { data, total } = invoiceStore.getAllInvoices({ source, limit, offset });
  res.json({ success: true, data, total });
});

/**
 * GET /api/invoices/stats
 * Dashboard summary statistics.
 */
router.get('/stats', (_req, res) => {
  const stats = invoiceStore.getStats();
  res.json({ success: true, data: stats });
});

/**
 * GET /api/invoices/:id
 * Single invoice detail.
 */
router.get('/:id', (req, res) => {
  const invoice = invoiceStore.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, data: invoice });
});

/**
 * GET /api/invoices/:id/download
 * Serve the actual invoice file.
 */
router.get('/:id/download', (req, res) => {
  const invoice = invoiceStore.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }

  const filePath = path.join(__dirname, '../../uploads/invoices', invoice.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found on disk' });
  }

  res.setHeader('Content-Type', invoice.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.originalName}"`);
  res.sendFile(filePath);
});

module.exports = router;
