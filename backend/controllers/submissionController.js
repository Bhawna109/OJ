const Submission = require('../models/Submission');

const createSubmission = async (req, res) => {
    const { problemId, code, language, status, output, compilationTime } = req.body;
    if (!problemId || !code || !language)
        return res.status(400).json({ error: 'problemId, code and language are required' });

    const submission = await Submission.create({
        problemId, code, language,
        status: status || 'Accepted',
        output, compilationTime,
        userId: req.user._id,
    });
    res.status(201).json(submission);
};

const getUserSubmissions = async (req, res) => {
    const submissions = await Submission.find({ userId: req.user._id })
        .populate('problemId', 'title difficulty')
        .sort({ createdAt: -1 });
    res.json(submissions);
};

const getSubmission = async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate('problemId', 'title difficulty')
        .populate('userId', 'firstName lastName');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
};

module.exports = { createSubmission, getUserSubmissions, getSubmission };
