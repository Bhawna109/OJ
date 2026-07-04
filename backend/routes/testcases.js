const router = require('express').Router();
const TestCase = require('../models/TestCase');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/:problemId', protect, adminOnly, async (req, res) => {
    const testcases = await TestCase.find({ problemId: req.params.problemId });
    res.json(testcases);
});

router.post('/', protect, adminOnly, async (req, res) => {
    const { problemId, input, expectedOutput, isSample } = req.body;
    if (!problemId || !input || !expectedOutput)
        return res.status(400).json({ error: 'problemId, input and expectedOutput are required' });
    const tc = await TestCase.create({ problemId, input, expectedOutput, isSample: isSample || false });
    res.status(201).json(tc);
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
    await TestCase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test case deleted' });
});

module.exports = router;
