const Problem = require('../models/Problem');

const getAllProblems = async (req, res) => {
    const problems = await Problem.find().select('-statement').populate('createdBy', 'firstName lastName');
    res.json(problems);
};

const getProblem = async (req, res) => {
    const problem = await Problem.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
};

const createProblem = async (req, res) => {
    const { title, statement, inputFormat, outputFormat, constraints, difficulty, tags } = req.body;
    if (!title || !statement || !inputFormat || !outputFormat || !constraints || !difficulty)
        return res.status(400).json({ error: 'All fields are required' });

    const problem = await Problem.create({
        title, statement, inputFormat, outputFormat, constraints, difficulty,
        tags: tags || [],
        createdBy: req.user._id,
    });
    res.status(201).json(problem);
};

const updateProblem = async (req, res) => {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
};

const deleteProblem = async (req, res) => {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json({ message: 'Problem deleted successfully' });
};

module.exports = { getAllProblems, getProblem, createProblem, updateProblem, deleteProblem };
