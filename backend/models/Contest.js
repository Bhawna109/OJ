const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title:         { type: String, required: true, trim: true },
    description:   { type: String, default: '' },
    startTime:     { type: Date, required: true },
    endTime:       { type: Date, required: true },
    problems:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Contest', contestSchema);
