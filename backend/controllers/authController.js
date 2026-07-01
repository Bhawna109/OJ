const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendToken = (res, user, statusCode) => {
    const token = generateToken(user._id);
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
    });
    res.status(statusCode).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token,
    });
};

const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password)
            return res.status(400).json({ error: 'All fields are required' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ error: 'Please enter a valid email address' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already registered' });

        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = await User.create({
            firstName, lastName, email, password, phone,
            verifyToken, verifyTokenExpiry,
        });

        await sendVerificationEmail(email, firstName, verifyToken);

        res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully! You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ error: 'Invalid email or password' });

        if (!user.isVerified)
            return res.status(401).json({ error: 'Please verify your email before logging in' });

        sendToken(res, user, 200);
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const logout = (req, res) => {
    res.cookie('token', '', { maxAge: 0, sameSite: 'none', secure: true });
    res.json({ message: 'Logged out successfully' });
};

const getMe = (req, res) => {
    res.json(req.user);
};

module.exports = { register, login, logout, getMe, verifyEmail };
