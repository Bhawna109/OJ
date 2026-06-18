const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Submission = require('./models/Submission');
const Problem = require('./models/Problem');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const problems = await Problem.find().select('_id');
    const validIds = problems.map(p => p._id);
    const result = await Submission.deleteMany({ problemId: { $nin: validIds } });
    console.log('Deleted stale submissions:', result.deletedCount);
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
