const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const serverDir = path.resolve(__dirname, '../..');
const projectDir = path.resolve(serverDir, '..');
const resolveFrom = (base, value) => path.isAbsolute(value) ? value : path.resolve(base, value);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  databasePath: resolveFrom(serverDir, process.env.DATABASE_PATH || './data/portfolio.db'),
  sessionSecret: process.env.SESSION_SECRET || '',
  uploadDir: resolveFrom(projectDir, process.env.UPLOAD_DIR || './uploads'),
};

module.exports = { env };
