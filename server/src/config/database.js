const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { env } = require('./env');

let db = null;
try {
  fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
  const opened = new Database(env.databasePath);
  opened.pragma('foreign_keys = ON');
  opened.pragma('busy_timeout = 5000');
  db = opened;
} catch {
  console.error('SQLite database could not be opened.');
}

function checkDatabaseConnection() {
  if (!db) throw new Error('SQLite database unavailable.');
  db.prepare('SELECT 1').get();
  return { ok: true };
}

module.exports = { db, checkDatabaseConnection };
