const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const { codeLimiter, aiLimiter, authLimiter } = require('./middleware/rateLimiter');
const aiCodeReview = require('./aiCodeReview');

// The compiler microservice runs untrusted code in isolation. The backend
// never executes code itself — it delegates over HTTP to this service.
const COMPILER_URL = process.env.COMPILER_URL || 'http://localhost:7000';
const SUPPORTED_LANGUAGES = ['cpp', 'java', 'py'];

// Sends one execution job to the compiler service.
// Returns { output } on success, or { status, error } on a known failure.
async function runOnCompiler(language, code, input) {
    const resp = await fetch(`${COMPILER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, input }),
    });
    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Compiler service error (${resp.status})`);
    }
    return resp.json();
}

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const contestRoutes = require('./routes/contests');
const testcaseRoutes = require('./routes/testcases');

const { protect } = require('./middleware/authMiddleware');
const TestCase = require('./models/TestCase');
const Submission = require('./models/Submission');
const User = require('./models/User');
const Contest = require('./models/Contest');

const app = express();

// Behind Nginx — trust the first proxy so rate limiting sees the real client IP
app.set('trust proxy', 1);

app.use(cors({
  origin: ['http://localhost:5173', 'https://oj-puce.vercel.app'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/testcases', testcaseRoutes);

app.get('/', (req, res) => res.send('AlgoU OJ Backend'));

app.get('/api/stats', async (req, res) => {
    try {
        const [users, submissions, contests] = await Promise.all([
            User.countDocuments(),
            Submission.countDocuments(),
            Contest.countDocuments(),
        ]);
        res.json({ users, submissions, contests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/run', codeLimiter, async (req, res) => {
    const { language = 'cpp', code, input } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    if (code.length > 50000) return res.status(400).json({ error: 'Code too large (max 50KB)' });
    if (!SUPPORTED_LANGUAGES.includes(language)) return res.status(400).json({ error: `Unsupported language: ${language}` });

    try {
        const result = await runOnCompiler(language, code, input || '');
        // On a compile/runtime/TLE/MLE failure, show the message in the output panel
        if (result.status) return res.json({ output: result.error });
        res.json({ output: result.output });
    } catch (error) {
        console.error('RUN ERROR:', error.message);
        res.status(503).json({ error: 'Execution service unavailable. Please try again.' });
    }
});

app.post('/api/submit', codeLimiter, protect, async (req, res) => {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language)
        return res.status(400).json({ error: 'problemId, code and language are required' });
    if (code.length > 50000) return res.status(400).json({ error: 'Code too large (max 50KB)' });
    if (!SUPPORTED_LANGUAGES.includes(language)) return res.status(400).json({ error: `Unsupported language: ${language}` });

    try {
        const testCases = await TestCase.find({ problemId });
        if (testCases.length === 0)
            return res.status(404).json({ error: 'No test cases found for this problem' });

        let status = 'Accepted';
        let failedOutput = '';
        let failedTestCase = null;
        const startTime = Date.now();

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const result = await runOnCompiler(language, code, tc.input);
            if (result.status) {
                // Known execution failure: TLE / MLE / Compilation Error / Runtime Error
                status = result.status;
                failedOutput = result.error;
                failedTestCase = { index: i + 1, input: tc.input, expected: tc.expectedOutput, got: failedOutput };
                break;
            }
            const output = result.output;
            if (output.trim() !== tc.expectedOutput.trim()) {
                status = 'Wrong Answer';
                failedOutput = output.trim();
                failedTestCase = { index: i + 1, input: tc.input, expected: tc.expectedOutput, got: output.trim() };
                break;
            }
        }

        const executionTime = Date.now() - startTime;

        const submission = await Submission.create({
            problemId,
            userId: req.user._id,
            code,
            language,
            status,
            output: failedOutput,
            compilationTime: executionTime,
        });

        res.status(201).json({
            _id: submission._id,
            status: submission.status,
            language: submission.language,
            compilationTime: submission.compilationTime,
            createdAt: submission.createdAt,
            failedTestCase,
            compilerOutput: ['Compilation Error', 'Runtime Error'].includes(status) ? failedOutput : undefined,
        });
    } catch (err) {
        console.error('SUBMIT ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/ai-review', aiLimiter, async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    try {
        const aiReview = await aiCodeReview(code);
        res.json({ aiReview });
    } catch (error) {
        console.error('AI REVIEW ERROR:', error);
        res.status(500).json({ error: error.message });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(process.env.PORT || 5000, () =>
            console.log(`Server running on port ${process.env.PORT || 5000}`)
        );
    })
    .catch((err) => console.error('MongoDB connection error:', err));
