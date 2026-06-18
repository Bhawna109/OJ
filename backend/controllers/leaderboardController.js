const Submission = require('../models/Submission');

const getLeaderboard = async (req, res) => {
    const leaderboard = await Submission.aggregate([
        { $match: { status: 'Accepted' } },
        { $group: { _id: '$userId', solved: { $addToSet: '$problemId' }, totalSubmissions: { $sum: 1 } } },
        { $project: { solved: { $size: '$solved' }, totalSubmissions: 1 } },
        { $sort: { solved: -1, totalSubmissions: 1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { solved: 1, totalSubmissions: 1, 'user.firstName': 1, 'user.lastName': 1, 'user.email': 1 } },
    ]);
    res.json(leaderboard);
};

module.exports = { getLeaderboard };
