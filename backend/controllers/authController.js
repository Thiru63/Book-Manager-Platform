const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { signupSchema, loginSchema } = require('../utils/validations');
const { sanitizeInput } = require('../utils/sanitize');

// Cookie options — must use SameSite=None for cross-domain (Vercel ↔ Render)
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,                    // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain cookies
    path: '/',
};

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const sanitized = sanitizeInput(req.body);
        const result = signupSchema.safeParse(sanitized);

        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
        }

        const { name, email, password } = result.data;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Create user (password hashed by pre-save hook)
        const user = new User({ name, email, passwordHash: password });
        await user.save();

        // Generate tokens
        const tokenPayload = { userId: user._id.toString(), email: user.email };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Store refresh token
        await RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        // Set cookies
        res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(201).json({
            message: 'Account created successfully',
            user: { id: user._id, name: user.name, email: user.email, readingGoal: user.readingGoal },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const sanitized = sanitizeInput(req.body);
        const result = loginSchema.safeParse(sanitized);

        if (!result.success) {
            return res.status(422).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors,
            });
        }

        const { email, password } = result.data;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const tokenPayload = { userId: user._id.toString(), email: user.email };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Rotate: delete old tokens, store new
        await RefreshToken.deleteMany({ userId: user._id });
        await RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('access_token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, readingGoal: user.readingGoal },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (refreshToken) {
            await RefreshToken.deleteOne({ token: refreshToken });
        }

        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('refresh_token', cookieOptions);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies.refresh_token;

        if (!oldRefreshToken) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        const payload = verifyRefreshToken(oldRefreshToken);
        if (!payload) {
            res.clearCookie('access_token', cookieOptions);
            res.clearCookie('refresh_token', cookieOptions);
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Check if token exists in DB (prevents reuse)
        const storedToken = await RefreshToken.findOne({ token: oldRefreshToken });
        if (!storedToken) {
            // Token reuse detected – invalidate all tokens for this user
            await RefreshToken.deleteMany({ userId: payload.userId });
            res.clearCookie('access_token', cookieOptions);
            res.clearCookie('refresh_token', cookieOptions);
            return res.status(401).json({ error: 'Token reuse detected. Please login again.' });
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Rotate tokens
        const tokenPayload = { userId: user._id.toString(), email: user.email };
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        await RefreshToken.deleteOne({ token: oldRefreshToken });
        await RefreshToken.create({
            userId: user._id,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('access_token', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie('refresh_token', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({
            message: 'Tokens refreshed',
            user: { id: user._id, name: user.name, email: user.email, readingGoal: user.readingGoal },
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: { id: user._id, name: user.name, email: user.email, readingGoal: user.readingGoal, createdAt: user.createdAt },
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { signup, login, logout, refresh, getMe };
