const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendToken = (res, user, statusCode) => {
    const token = generateToken(user._id);
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
    });
    res.status(statusCode).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token,
    });
};

const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password)
            return res.status(400).json({ error: 'All fields are required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: 'Email already registered' });

        const user = await User.create({ firstName, lastName, email, password, phone });
        sendToken(res, user, 201);
    } catch (err) {
        console.error('Register error:', err.message);
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

        sendToken(res, user, 200);
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const logout = (req, res) => {
    res.cookie('token', '', { maxAge: 0 });
    res.json({ message: 'Logged out successfully' });
};

const getMe = (req, res) => {
    res.json(req.user);
};

module.exports = { register, login, logout, getMe };
