const bcrypt = require('bcryptjs');
const { createCsrfToken } = require('../middleware/csrf');
const { findAdminUserByUsername } = require('../services/adminService');

async function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await findAdminUserByUsername(username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const sessionUser = { id: user.id, username: user.username };
    const csrfToken = createCsrfToken();
    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error('Could not establish admin session.');
        return res.status(500).json({ error: 'Login failed.' });
      }

      req.session.user = sessionUser;
      req.session.csrfToken = csrfToken;
      return req.session.save((saveError) => {
        if (saveError) {
          console.error('Could not save admin session.');
          return res.status(500).json({ error: 'Login failed.' });
        }
        return res.json({ ok: true, user: sessionUser, csrf_token: csrfToken });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed.' });
    }

    res.clearCookie('portfolio.sid');
    return res.json({ ok: true, message: 'Logged out successfully.' });
  });
}

function me(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: req.session.user,
    csrf_token: req.session.csrfToken,
  });
}

module.exports = {
  login,
  logout,
  me,
};
