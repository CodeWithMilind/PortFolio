const bcrypt = require('bcryptjs');
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

    req.session.user = {
      id: user.id,
      username: user.username,
    };

    return res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
      },
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
  });
}

module.exports = {
  login,
  logout,
  me,
};
