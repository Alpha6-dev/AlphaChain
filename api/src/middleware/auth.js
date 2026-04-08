'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid JWT token', { error: err.message });
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, config.jwt.secret);
  } catch (_) {
    // Silently ignore invalid tokens in optional auth
  }

  next();
}

module.exports = { authenticate, optionalAuth };
