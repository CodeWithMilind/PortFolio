const fs = require('fs');
const path = require('path');
const { db } = require('../src/config/database');

const migrationsDir = path.resolve(__dirname, '../migrations');
db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version));
const files = fs.readdirSync(migrationsDir).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  const apply = db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
  });
  apply();
  console.log(`Applied ${file}`);
}
console.log(`SQLite database ready at ${path.resolve(db.name)}`);
db.close();
