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
    data: {
        type: Object,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Spreadsheet', SpreadsheetSchema);