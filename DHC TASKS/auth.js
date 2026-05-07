const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const logger = require('../logger');

const router = express.Router();

// In-memory user store (replace with DB in production)
const users = [];

// ── SIGNUP ──────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Sanitize: strip HTML tags to prevent XSS stored in any downstream render
    const safeUsername = validator.escape(username.trim());

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check duplicate
    const exists = users.find(u => u.email === email);
    if (exists) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username: safeUsername,
      email: validator.normalizeEmail(email),
      password: hashedPassword
    };

    users.push(newUser);
    logger.info(`New user registered: ${safeUsername} (${email})`);

    return res.status(201).json({ message: 'User registered successfully.' });

  } catch (err) {
    logger.error(`Signup error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const user = users.find(u => u.email === validator.normalizeEmail(email));

    // Generic message prevents user enumeration
    if (!user) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`Wrong password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret-change-in-prod',
      { expiresIn: '1h' }
    );

    logger.info(`User logged in: ${user.username}`);
    return res.status(200).json({ token });

  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
module.exports.users = users; // exported for profile route access
