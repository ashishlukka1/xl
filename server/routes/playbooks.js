const express = require('express');
const { Playbook } = require('../Schema');
const authMiddleware = require('../middleware/auth');
const { buildApiError } = require('../utils/helpers');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const playbooks = await Playbook.find().sort({ createdAt: -1 });
    return res.json({ playbooks });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const playbook = await Playbook.create(req.body);
    return res.status(201).json({ playbook });
  } catch (error) {
    const e = buildApiError(error, 400);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

module.exports = router;
