const express = require('express');
const { CsmUser } = require('../Schema');
const authMiddleware = require('../middleware/auth');
const { sanitizeUser, signToken, buildApiError } = require('../utils/helpers');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const existing = await CsmUser.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'A CSM account with that email already exists.' });

    const user = await CsmUser.create({ name, email, password });
    return res.status(201).json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await CsmUser.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

    return res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
