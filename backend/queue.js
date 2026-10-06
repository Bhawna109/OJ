const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null on the connection.
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// The judging queue: backend adds jobs, the worker consumes them.
const submissionQueue = new Queue('submissions', {
    connection,
    defaultJobOptions: {
        attempts: 2,                                   // retry once on transient failure
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: 200,                         // keep Redis from filling up
        removeOnFail: 200,
    },
});

module.exports = { submissionQueue, connection };
