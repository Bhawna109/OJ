const express = require('express');

const generateFile = require('./generateFile');
const generateInputFile = require('./generateInputFile');
const executeCpp = require('./executeCpp');
const executeJava = require('./executeJava');
const executePython = require('./executePython');
const { startCleanup } = require('./utils/cleanup');

const app = express();
app.use(express.json({ limit: '1mb' }));

const executors = {
    cpp: executeCpp,
    java: executeJava,
    py: executePython,
};

app.get('/', (req, res) => res.send('BhawnaOJ Compiler Service'));

// Single job: compile + run one piece of code against one input.
// Returns { output } on success, or { status, error } on a known failure
// (Time Limit Exceeded / Memory Limit Exceeded / Compilation Error / Runtime Error).
app.post('/execute', async (req, res) => {
    const { language = 'cpp', code, input } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    if (code.length > 50000) return res.status(400).json({ error: 'Code too large (max 50KB)' });

    const execute = executors[language];
    if (!execute) return res.status(400).json({ error: `Unsupported language: ${language}` });

    try {
        const filePath = generateFile(language, code);
        const inputFilePath = generateInputFile(input || '');
        const output = await execute(filePath, inputFilePath);
        res.json({ output });
    } catch (err) {
        let status;
        if (err.message === 'Time Limit Exceeded') status = 'Time Limit Exceeded';
        else if (err.message === 'Memory Limit Exceeded') status = 'Memory Limit Exceeded';
        else if (err.message.startsWith('COMPILE_ERROR:')) status = 'Compilation Error';
        else status = 'Runtime Error';
        const error = err.message.replace(/^(COMPILE_ERROR:|RUNTIME_ERROR:)/, '');
        res.json({ status, error });
    }
});

const PORT = process.env.PORT || 7000;
startCleanup();
app.listen(PORT, () => console.log(`Compiler service running on port ${PORT}`));
