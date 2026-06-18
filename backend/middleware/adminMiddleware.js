const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ error: 'Access denied: Admins only' });
};

module.exports = { adminOnly };
