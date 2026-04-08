'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const db = require('../db/pool');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (admin only, except for first user bootstrap).
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, role, orgMSP } = req.body;

    if (!username || !email || !password || !role) {
      const err = new Error('Missing required fields: username, email, password, role');
      err.statusCode = 400;
      throw err;
    }

    // Check if any users exist (bootstrap mode)
    const countResult = await db.query('SELECT COUNT(*) FROM users');
    const isBootstrap = parseInt(countResult.rows[0].count, 10) === 0;

    // After bootstrap, only admins can register new users
    if (!isBootstrap) {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }
      const token = header.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ success: false, error: 'Only admins can register new users' });
        }
      } catch (_) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const msp = orgMSP || 'AlphaOrgMSP';

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, org_msp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, org_msp, created_at`,
      [username, email, passwordHash, isBootstrap ? 'admin' : role, msp]
    );

    const user = result.rows[0];
    logger.info('User registered', { userId: user.id, username: user.username, role: user.role });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message = 'Username or email already exists';
    }
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return JWT.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      const err = new Error('Missing required fields: username, password');
      err.statusCode = 400;
      throw err;
    }

    const result = await db.query(
      'SELECT id, username, email, password_hash, role, org_msp FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      orgMSP: user.org_msp,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          orgMSP: user.org_msp,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, org_msp, created_at, updated_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
