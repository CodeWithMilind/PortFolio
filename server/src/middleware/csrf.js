const crypto = require('crypto');

function createCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!req.session || !req.session.user) return next();

  const supplied = req.get('x-csrf-token');
  const expected = req.session.csrfToken;
  if (typeof supplied !== 'string' || typeof expected !== 'string') {
    return res.status(403).json({ error: 'Request verification failed. Refresh the admin page and try again.' });
  }

  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(403).json({ error: 'Request verification failed. Refresh the admin page and try again.' });
  }

  return next();
}

module.exports = { createCsrfToken, requireCsrf };
