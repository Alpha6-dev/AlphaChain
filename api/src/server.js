'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const shipmentRoutes = require('./routes/shipments');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const tokenRoutes = require('./routes/tokens');
const { disconnect } = require('./utils/fabricClient');
const db = require('./db/pool');
const { initDatabase } = require('./db/init');

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

app.use('/api/auth', authRoutes);
app.use('/api/shipments', authenticate, shipmentRoutes);
app.use('/api/search', authenticate, searchRoutes);
app.use('/api/tokens', authenticate, tokenRoutes);

// --- Error handling ---
app.use(errorHandler);

// --- Start server ---
// Initialize database then start server
initDatabase()
  .then(() => logger.info('Database ready'))
  .catch((err) => logger.warn('Database init skipped (PostgreSQL may not be running)', { error: err.message }));

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
  await db.end();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
