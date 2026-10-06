const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    problemId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code:            { type: String, required: true },
    language:        { type: String, enum: ['cpp', 'java', 'py'], required: true },
    status:          { type: String, enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'], default: 'Pending' },
    output:          { type: String },
    compilationTime: { type: Number },
    failedTestCase:  { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
