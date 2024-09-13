const mongoose = require('mongoose');

const SpreadsheetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cells: {
        type: Object,
        default: {},
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        access: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view',
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Spreadsheet', SpreadsheetSchema);