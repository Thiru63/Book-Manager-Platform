const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, logout, refresh, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Rate limiter for auth routes: 20 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', auth, getMe);

module.exports = router;
