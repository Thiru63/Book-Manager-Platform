const { verifyAccessToken } = require('../utils/jwt');

/**
 * Auth middleware - verifies JWT access token from http-only cookie
 * Attaches user payload to req.user
 */
const auth = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = payload; // { userId, email }
    next();
};

module.exports = auth;
