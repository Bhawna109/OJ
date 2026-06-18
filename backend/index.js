const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const generateFile = require('./generateFile');
const executeCpp = require('./executeCpp');
const executeJava = require('./executeJava');
const executePython = require('./executePython');
const generateInputFile = require('./generateInputFile');
const aiCodeReview = require('./aiCodeReview');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const problemRoutes = require('./routes/problems');
const submissionRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const contestRoutes = require('./routes/contests');

const { protect } = require('./middleware/authMiddleware');
const TestCase = require('./models/TestCase');
const Submission = require('./models/Submission');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/contests', contestRoutes);

const executors = {
    cpp: executeCpp,
    java: executeJava,
    py: executePython,
};

app.get('/', (req, res) => res.send('AlgoU OJ Backend'));

app.post('/run', async (req, res) => {
    const { language = 'cpp', code, input } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const execute = executors[language];
    if (!execute) return res.status(400).json({ error: `Unsupported language: ${language}` });

    try {
        const filePath = generateFile(language, code);
        const inputFilePath = generateInputFile(input);
        const output = await execute(filePath, inputFilePath);
        res.json({ filePath, output });
    } catch (error) {
        console.error('RUN ERROR:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/submit', protect, async (req, res) => {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language)
        return res.status(400).json({ error: 'problemId, code and language are required' });

    const execute = executors[language];
    if (!execute) return res.status(400).json({ error: `Unsupported language: ${language}` });

    try {
        const testCases = await TestCase.find({ problemId });
        if (testCases.length === 0)
            return res.status(404).json({ error: 'No test cases found for this problem' });

        const filePath = generateFile(language, code);
        let status = 'Accepted';
        let failedOutput = '';
        let failedTestCase = null;

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputFilePath = generateInputFile(tc.input);
            let output;
            try {
                output = await execute(filePath, inputFilePath);
            } catch (err) {
                status = err.message.includes('error:') ? 'Compilation Error' : 'Runtime Error';
                failedOutput = err.message;
                failedTestCase = { index: i + 1, input: tc.input, expected: tc.expectedOutput, got: '' };
                break;
            }
            if (output.trim() !== tc.expectedOutput.trim()) {
                status = 'Wrong Answer';
                failedOutput = output.trim();
                failedTestCase = { index: i + 1, input: tc.input, expected: tc.expectedOutput, got: output.trim() };
                break;
            }
        }

        const submission = await Submission.create({
            problemId,
            userId: req.user._id,
            code,
            language,
            status,
            output: failedOutput,
        });

        res.status(201).json({ ...submission.toObject(), failedTestCase });
    } catch (err) {
        console.error('SUBMIT ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/ai-review', async (req, res) => {
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
