const express = require('express');
const { checkDatabaseConnection } = require('../config/database');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const dbState = await checkDatabaseConnection();
    return res.json({
      status: 'ok',
      database: 'connected',
      database_type: 'sqlite',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      database_type: 'sqlite',
    });
  }
});

module.exports = router;
