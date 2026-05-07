const jwt = require('jsonwebtoken');
const logger = require('../logger');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-in-prod');
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Invalid token used from IP: ${req.ip}`);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;
