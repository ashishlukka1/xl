const jwt = require('jsonwebtoken');
const { CsmUser } = require('../Schema');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'velocis-dev-secret');
    const user = await CsmUser.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: 'Session is no longer valid.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authMiddleware;
