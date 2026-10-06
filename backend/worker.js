const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const { Worker } = require('bullmq');

const { connection } = require('./queue');
const { runOnCompiler } = require('./compilerClient');
const TestCase = require('./models/TestCase');
const Submission = require('./models/Submission');

// How many submissions to judge in parallel. Bounds load so a burst of
// submissions never overwhelms the box — the rest wait in the queue.
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 2;

async function judge(job) {
    const { submissionId, problemId, code, language } = job.data;

    const testCases = await TestCase.find({ problemId });
    if (testCases.length === 0) {
        await Submission.findByIdAndUpdate(submissionId, { status: 'Runtime Error', output: 'No test cases found' });
        return;
    }

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

    await Submission.findByIdAndUpdate(submissionId, {
        status,
        output: failedOutput,
        compilationTime: executionTime,
        failedTestCase,
    });

    // Returned value is delivered to the API via BullMQ QueueEvents and pushed
    // to the client over WebSocket.
    return {
        submissionId,
        status,
        language,
        compilationTime: executionTime,
        failedTestCase,
        compilerOutput: ['Compilation Error', 'Runtime Error'].includes(status) ? failedOutput : undefined,
    };
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Worker: MongoDB connected');
        const worker = new Worker('submissions', judge, { connection, concurrency: CONCURRENCY });
        worker.on('completed', (job) => console.log(`Judged submission ${job.data.submissionId}`));
        worker.on('failed', async (job, err) => {
            console.error(`Job failed for ${job?.data?.submissionId}:`, err.message);
            // After all retries are exhausted, don't leave the submission stuck on Pending
            if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
                await Submission.findByIdAndUpdate(job.data.submissionId, {
                    status: 'Runtime Error',
                    output: 'Judging failed. Please try submitting again.',
                }).catch(() => {});
            }
        });
        console.log(`Worker running (concurrency ${CONCURRENCY})`);
    })
    .catch((err) => console.error('Worker MongoDB connection error:', err));
