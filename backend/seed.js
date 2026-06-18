const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');
const User = require('./models/User');
const Contest = require('./models/Contest');

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        admin = await User.create({
            firstName: 'Admin', lastName: 'AlgoU',
            email: 'admin@algou.com', password: 'admin123', role: 'admin',
        });
        console.log('Admin created: admin@algou.com / admin123');
    }

    let p1, p2, p3;
    const existingCount = await Problem.countDocuments();

    if (existingCount >= 3) {
        console.log('Problems already seeded, loading existing IDs...');
        [p1, p2, p3] = await Problem.find().limit(3);
    } else {
        await Problem.deleteMany({});
        await TestCase.deleteMany({});

        p1 = await Problem.create({
            title: 'Two Sum',
            statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n**Example 1:**\n```\nInput: n=4, nums=[2,7,11,15], target=9\nOutput: 0 1\n```\n\n**Example 2:**\n```\nInput: n=3, nums=[3,2,4], target=6\nOutput: 1 2\n```',
            inputFormat: 'Line 1: n (size of array)\nLine 2: n space-separated integers\nLine 3: target',
            outputFormat: 'Two space-separated indices i j (0-indexed)',
            constraints: '2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.',
            difficulty: 'Easy',
            tags: ['Array', 'Hash Map'],
            createdBy: admin._id,
        });
        await TestCase.insertMany([
            { problemId: p1._id, input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
            { problemId: p1._id, input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: true },
            { problemId: p1._id, input: '5\n1 5 3 8 2\n10', expectedOutput: '3 4', isSample: false },
        ]);
        console.log('Problem 1: Two Sum seeded');

        p2 = await Problem.create({
            title: 'Valid Parentheses',
            statement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n\n**Example 1:**\n```\nInput: ()\nOutput: YES\n```\n\n**Example 2:**\n```\nInput: (]\nOutput: NO\n```',
            inputFormat: 'A single string s',
            outputFormat: 'Print YES if valid, NO otherwise',
            constraints: '1 <= s.length <= 10^4\ns consists of parentheses only `()[]{}`',
            difficulty: 'Easy',
            tags: ['Stack', 'String'],
            createdBy: admin._id,
        });
        await TestCase.insertMany([
            { problemId: p2._id, input: '()', expectedOutput: 'YES', isSample: true },
            { problemId: p2._id, input: '()[]{}', expectedOutput: 'YES', isSample: true },
            { problemId: p2._id, input: '(]', expectedOutput: 'NO', isSample: false },
            { problemId: p2._id, input: '{[()]}', expectedOutput: 'YES', isSample: false },
            { problemId: p2._id, input: '([)]', expectedOutput: 'NO', isSample: false },
        ]);
        console.log('Problem 2: Valid Parentheses seeded');

        p3 = await Problem.create({
            title: 'Maximum Subarray',
            statement: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\n**Example 1:**\n```\nInput: n=9, nums=[-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: [4,-1,2,1] has the largest sum = 6\n```\n\n**Example 2:**\n```\nInput: n=1, nums=[1]\nOutput: 1\n```',
            inputFormat: 'Line 1: n (size of array)\nLine 2: n space-separated integers',
            outputFormat: 'A single integer — the maximum subarray sum',
            constraints: '1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
            difficulty: 'Medium',
            tags: ['Array', 'Dynamic Programming'],
            createdBy: admin._id,
        });
        await TestCase.insertMany([
            { problemId: p3._id, input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
            { problemId: p3._id, input: '1\n1', expectedOutput: '1', isSample: true },
            { problemId: p3._id, input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: false },
            { problemId: p3._id, input: '4\n-1 -2 -3 -4', expectedOutput: '-1', isSample: false },
        ]);
        console.log('Problem 3: Maximum Subarray seeded');
    }

    // Always re-seed contests with correct problem IDs
    await Contest.deleteMany({});
    const now = new Date();
    await Contest.insertMany([
        {
            title: 'AlgoU Weekly #42',
            description: 'Weekly contest with 4 problems covering arrays and strings.',
            startTime: new Date(now.getTime() - 30 * 60 * 1000),
            endTime: new Date(now.getTime() + 60 * 60 * 1000),
            problems: [p1._id, p2._id],
            registrations: [],
            createdBy: admin._id,
        },
        {
            title: 'AlgoU Biweekly #18',
            description: 'Biweekly contest with 5 problems.',
            startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            problems: [p1._id, p2._id, p3._id],
            registrations: [],
            createdBy: admin._id,
        },
        {
            title: 'AlgoU Monthly Challenge',
            description: 'Monthly challenge with 6 hard problems.',
            startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
            problems: [p1._id, p2._id, p3._id],
            registrations: [],
            createdBy: admin._id,
        },
        {
            title: 'AlgoU Weekly #41',
            description: 'Previous weekly contest.',
            startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
            problems: [p1._id, p2._id],
            registrations: [],
            createdBy: admin._id,
        },
    ]);
    console.log('Contests seeded');

    console.log('\nSeeding complete!');
    process.exit(0);
};

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
