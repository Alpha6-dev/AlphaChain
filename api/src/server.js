'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const shipmentRoutes = require('./routes/shipments');
const { disconnect } = require('./utils/fabricClient');

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'AlphaChain API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/shipments', shipmentRoutes);

// --- Error handling ---
app.use(errorHandler);

// --- Start server ---
const server = app.listen(config.port, () => {
  logger.info(`AlphaChain API running on port ${config.port}`, {
    env: config.nodeEnv,
    channel: config.fabric.channelName,
  });
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  await disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
