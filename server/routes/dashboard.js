const express = require('express');
const authMiddleware = require('../middleware/auth');
const { getDashboardPayload, buildApiError } = require('../utils/helpers');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const payload = await getDashboardPayload(req.user._id);
    return res.json(payload);
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

module.exports = router;
