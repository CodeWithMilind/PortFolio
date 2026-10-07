const express = require('express');
const { login, logout, me } = require('../controllers/authController');
const { requireCsrf } = require('../middleware/csrf');

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireCsrf, logout);
router.get('/me', me);

module.exports = router;
