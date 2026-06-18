const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title:        { type: String, required: true, trim: true },
    statement:    { type: String, required: true },
    inputFormat:  { type: String, required: true },
    outputFormat: { type: String, required: true },
    constraints:  { type: String, required: true },
    difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags:         [{ type: String }],
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Problem', problemSchema);
