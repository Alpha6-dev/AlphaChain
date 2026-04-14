'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const invoiceStore = require('../store/invoiceStore');

const router = express.Router();

// Configure multer for invoice file uploads
const uploadDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * POST /api/webhook/whatsapp
 * Receives invoice files from n8n workflow (email or WhatsApp sources).
 * Expects multipart/form-data with field "invoice" containing the file.
 */
router.post('/whatsapp', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No invoice file provided. Send as multipart/form-data with field "invoice".',
      });
    }

    const { originalname, filename, size, mimetype } = req.file;

    logger.info('Invoice received via webhook', {
      originalname,
      filename,
      size,
      mimetype,
      source: req.body.source || 'unknown',
    });

    const invoice = invoiceStore.addInvoice({
      filename,
      originalName: originalname,
      size,
      mimetype,
      source: req.body.source || 'unknown',
    });

    res.status(200).json({
      success: true,
      message: 'Invoice received and queued for processing',
      data: invoice,
    });
  } catch (err) {
    logger.error('Webhook invoice processing failed', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process invoice',
    });
  }
});

/**
 * GET /api/webhook/whatsapp
 * Meta/WhatsApp webhook verification endpoint.
 * Returns hub.challenge when hub.verify_token matches.
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'alphachain-verify-token';

  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification failed', { mode, token });
  return res.status(403).json({ success: false, error: 'Verification failed' });
});

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File too large (max 10 MB)' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(415).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = router;
