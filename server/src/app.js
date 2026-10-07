const express = require('express');
const session = require('express-session');
const { env } = require('./config/env');
const { checkDatabaseConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const { router: uploadRoutes } = require('./routes/uploads');
const { requireCsrf } = require('./middleware/csrf');
const fs = require('fs');
const path = require('path');

const app = express();

if (!env.sessionSecret) {
  throw new Error('SESSION_SECRET must be set in the environment before starting the server.');
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'portfolio.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.use('/uploads', (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' });
  let relative;
  try { relative = decodeURIComponent(req.path).replace(/^\/+/, ''); }
  catch { return res.status(404).json({ error: 'File not found.' }); }
  const match = /^(projects|certificates|awards|profile)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|jpeg|png|webp)$|^(cv)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(pdf)$/i.exec(relative);
  if (!match) return res.status(404).json({ error: 'File not found.' });
  const bucket = match[1] || match[4];
  const filename = `${match[2] || match[5]}.${(match[3] || match[6]).toLowerCase()}`;
  const target = path.resolve(env.uploadDir, bucket, filename);
  Promise.all([fs.promises.realpath(env.uploadDir), fs.promises.realpath(target)])
    .then(([realRoot, realTarget]) => {
      const relativeTarget = path.relative(realRoot, realTarget);
      const expectedTarget = path.join(bucket, filename);
      const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
      if (!relativeTarget || relativeTarget.startsWith(`..${path.sep}`) || path.isAbsolute(relativeTarget) || normalize(relativeTarget) !== normalize(expectedTarget)) {
        return res.status(404).json({ error: 'File not found.' });
      }
      return fs.promises.stat(realTarget).then((stat) => {
        if (!stat.isFile()) return res.status(404).json({ error: 'File not found.' });
        return res.sendFile(realTarget, {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Disposition': path.extname(filename).toLowerCase() === '.pdf' ? 'inline; filename="cv.pdf"' : 'inline',
          },
        }, (error) => {
          if (error && !res.headersSent) res.status(404).json({ error: 'File not found.' });
        });
      });
    })
    .catch(() => {
      if (!res.headersSent) res.status(404).json({ error: 'File not found.' });
    });
});

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/admin', requireCsrf);
app.use('/api/admin/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'Portfolio backend',
    status: 'running',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  return res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  try {
    await Promise.race([
      checkDatabaseConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout after 1.5s')), 1500)
      ),
    ]);
    console.log('SQLite connection successful.');
  } catch (error) {
    console.warn('SQLite is not available. Server started in degraded mode.', error.message);
  }

  const port = env.port;
  app.listen(port, () => {
    console.log(`Portfolio backend listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
