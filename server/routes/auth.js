const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport'); // Import Passport
const User = require('../models/User');
const { validateInterests } = require('../utils/moderation');

// --- Google Auth Routes ---

// 1. Initiate Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication, issue JWT
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Redirect to Frontend with token
        // Fallback to localhost if env not set, but ensure CLIENT_URL is set in prod
        const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
        res.redirect(`${clientUrl}?token=${token}`);
    }
);

// Register
router.post('/register', async (req, res) => {

    try {
        const { displayName, email, password } = req.body; // Simplified: Bio/Interests move to step 2

        if (!displayName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User (Interests/Bio empty initially)
        const newUser = new User({
            displayName,
            email,
            password: hashedPassword,
            bio: '',
            interests: [],
            profilePhoto: null
        });

        await newUser.save();

        // Issue JWT for immediate login
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                displayName: newUser.displayName,
                email: newUser.email,
                bio: newUser.bio,
                interests: newUser.interests,
                location: newUser.location,
                profilePhoto: null,
                initials: getInitials(newUser.displayName)
            }
        });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Server error during registration', details: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Update Last Login
        user.lastLogin = Date.now();
        await user.save();

        // Issue JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                displayName: user.displayName,
                email: user.email,
                bio: user.bio,
                interests: user.interests,
                location: user.location,
                profilePhoto: user.profilePhoto,
                initials: getInitials(user.displayName)
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server error during login', details: err.message });
    }
});

// Forgot Password (Returns raw temporary password for display)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await User.findOne({ email });
        if (!user) {
            // For security, generic message? User requested "give the user a strong temporary password".
            // If user not found, we probably shouldn't show a password.
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate strong random password
        const tempPassword = crypto.randomBytes(8).toString('hex'); // 16 chars

        // Hash and Save
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(tempPassword, salt);
        await user.save();

        // Return raw password for frontend display
        res.json({ message: 'Temporary password generated', tempPassword });

    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper
const getInitials = (name) => {
    const parts = (name || '').split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

module.exports = router;
