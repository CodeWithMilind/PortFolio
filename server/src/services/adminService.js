const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

async function findAdminUserByUsername(username) {
  return db.prepare('SELECT id, username, password_hash, created_at, updated_at FROM admin_users WHERE username = ?').get(username) || null;
}

async function createAdminUser(username, password) {
  const passwordHash = await bcrypt.hash(password, 12);

  db.prepare(`INSERT INTO admin_users (username, password_hash) VALUES (?, ?)
    ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP`).run(username, passwordHash);
  return db.prepare('SELECT id, username, created_at, updated_at FROM admin_users WHERE username = ?').get(username);
}

module.exports = {
  findAdminUserByUsername,
  createAdminUser,
};
