const express = require('express');
const validator = require('validator');
const verifyToken = require('../middleware/authMiddleware');
const { users } = require('./auth');
const logger = require('../logger');

const router = express.Router();

// ── GET PROFILE (protected) ──────────────────────────────────────────────────
router.get('/', verifyToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  logger.info(`Profile accessed by: ${user.username}`);
  // Never return hashed password
  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email
  });
});

// ── UPDATE PROFILE (protected) ───────────────────────────────────────────────
router.put('/', verifyToken, (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  const safeUsername = validator.escape(username.trim());

  if (!validator.isLength(safeUsername, { min: 3, max: 30 })) {
    return res.status(400).json({ error: 'Username must be 3-30 characters.' });
  }

  const userIndex = users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  users[userIndex].username = safeUsername;
  logger.info(`Profile updated for user ID: ${req.user.id}`);

  return res.status(200).json({ message: 'Profile updated.', username: safeUsername });
});

module.exports = router;
