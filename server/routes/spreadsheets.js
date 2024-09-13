const express = require('express');
const router = express.Router();
const Spreadsheet = require('../models/Spreadsheet');
const User = require('../models/User'); // Add this line to import the 'User' model
const auth = require('../middleware/auth');

// Create a new spreadsheet
router.post('/', auth, async (req, res) => {
    try {
        const newSpreadsheet = new Spreadsheet({
            title: req.body.title,
            owner: req.user.id,
        });
        const spreadsheet = await newSpreadsheet.save();
        res.json(spreadsheet);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get all spreadsheets for a user
router.get('/', auth, async (req, res) => {
    try {
        const spreadsheets = await Spreadsheet.find({ owner: req.user.id });
        res.json(spreadsheets);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Share a spreadsheet
router.post('/:id/share', auth, async (req, res) => {
    try {
        const spreadsheet = await Spreadsheet.findById(req.params.id);
        if (!spreadsheet) {
            return res.status(404).json({ msg: 'Spreadsheet not found' });
        }
        if (spreadsheet.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        const { email, access } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        spreadsheet.sharedWith.push({ user: user._id, access });
        await spreadsheet.save();
        res.json(spreadsheet);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;