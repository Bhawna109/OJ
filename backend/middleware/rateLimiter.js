const rateLimit = require('express-rate-limit');

// Shared response when a client exceeds a limit
const message = { error: 'Too many requests. Please slow down and try again shortly.' };

// Code execution (run + submit): each request spawns a compiler/runtime process,
// so this is the most expensive route and the biggest DoS risk.
const codeLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 30,               // 30 executions per minute per IP
    message,
    standardHeaders: true, // send RateLimit-* headers
    legacyHeaders: false,
});

// AI review: protects the Groq API quota from being drained by spam.
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 10,               // 10 AI reviews per minute per IP
    message,
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth (register + login): slows brute-force attempts and protects the
// Gmail sending quota from mass registration.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // 20 attempts per 15 min per IP
    message,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { codeLimiter, aiLimiter, authLimiter };
