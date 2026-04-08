'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./pool');
const logger = require('../utils/logger');

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await db.query(schema);
    logger.info('Database schema initialized');

    // Seed admin user if no users exist
    const countResult = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(countResult.rows[0].count, 10) === 0) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      await db.query(
        `INSERT INTO users (username, email, password_hash, role, org_msp)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'admin@alphachain.io', passwordHash, 'admin', 'AlphaOrgMSP']
      );
      logger.info('Seeded default admin user (username: admin, password: admin123)');
    }

    logger.info('Database initialization complete');
  } catch (err) {
    logger.error('Database initialization failed', { error: err.message });
    throw err;
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase };
