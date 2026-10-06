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
const { runOnCompiler, SUPPORTED_LANGUAGES } = require('./compilerClient');
const { submissionQueue } = require('./queue');

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

        // Create the submission as Pending, enqueue the judging job, and return
        // immediately. The worker processes it and updates the status; the
        // frontend polls GET /api/submissions/:id for the result.
        const submission = await Submission.create({
            problemId,
            userId: req.user._id,
            code,
            language,
            status: 'Pending',
        });

        await submissionQueue.add('judge', {
            submissionId: submission._id.toString(),
            problemId,
            code,
            language,
        });

        res.status(202).json({ submissionId: submission._id, status: 'Pending' });
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
