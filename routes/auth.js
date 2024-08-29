const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Checks if User Exists
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).json({ msg: "User Already Exists!" });
        }

        // New User Created!
        user = new User({
            username,
            email,
            password
        });


        // Hash Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save to the Database
        await user.save();

        const payload = {
            user: {
                id: user.id,
            }
        }

        // jwt.sign(payload, secretOrPrivateKey, [options, callback])
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
})

//Login
router.post('./login', async (req, res) => {
    try {
        // Destructuring
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.send(400).json({ msg: 'Invalid Credintials ' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;