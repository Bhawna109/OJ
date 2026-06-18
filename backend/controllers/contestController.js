const Contest = require('../models/Contest');

const getStatus = (start, end) => {
    const now = new Date();
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Live';
};

const getContests = async (req, res) => {
    try {
        const contests = await Contest.find()
            .populate('problems', 'title difficulty')
            .populate('createdBy', 'firstName lastName')
            .sort({ startTime: -1 });

        const result = contests.map(c => ({
            ...c.toObject(),
            status: getStatus(c.startTime, c.endTime),
            participantCount: c.registrations.length,
            isRegistered: req.user ? c.registrations.includes(req.user._id) : false,
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id)
            .populate('problems', 'title difficulty tags')
            .populate('createdBy', 'firstName lastName');
        if (!contest) return res.status(404).json({ error: 'Contest not found' });
        res.json({ ...contest.toObject(), status: getStatus(contest.startTime, contest.endTime) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createContest = async (req, res) => {
    try {
        const { title, description, startTime, endTime, problems } = req.body;
        if (!title || !startTime || !endTime)
            return res.status(400).json({ error: 'title, startTime and endTime are required' });
        if (new Date(startTime) >= new Date(endTime))
            return res.status(400).json({ error: 'endTime must be after startTime' });

        const contest = await Contest.create({
            title, description, startTime, endTime,
            problems: problems || [],
            createdBy: req.user._id,
        });
        res.status(201).json(contest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const registerContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });
        if (getStatus(contest.startTime, contest.endTime) === 'Ended')
            return res.status(400).json({ error: 'Contest has already ended' });
        if (contest.registrations.includes(req.user._id))
            return res.status(400).json({ error: 'Already registered' });

        contest.registrations.push(req.user._id);
        await contest.save();
        res.json({ message: 'Registered successfully', participantCount: contest.registrations.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const unregisterContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ error: 'Contest not found' });
        contest.registrations = contest.registrations.filter(id => id.toString() !== req.user._id.toString());
        await contest.save();
        res.json({ message: 'Unregistered successfully', participantCount: contest.registrations.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getContests, getContest, createContest, registerContest, unregisterContest };
