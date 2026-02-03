const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Although we are using stateless JWTs, passport requires serialization functions for session support if typically used. 
// However, we are explicitely NOT using sessions (session: false) in the route.
// But some passport implementations still check for these if initialization isn't careful.
// Safe to add them just in case, though they might not be used.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Google Console Env Variable Check (User named it CALLBACK_URL)
    callbackURL: process.env.GOOGLE_CALLBACK_URL || process.env.CALLBACK_URL || "/api/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Check if user exists with googleId
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
            return done(null, existingUser);
        }

        // 2. Check if user exists with same email (Link Account)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
            const existingEmailUser = await User.findOne({ email });
            if (existingEmailUser) {
                existingEmailUser.googleId = profile.id;
                // We keep their existing profile info (bio, etc) to not overwrite it violently
                if (!existingEmailUser.profilePhoto) {
                    existingEmailUser.profilePhoto = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
                }
                await existingEmailUser.save();
                return done(null, existingEmailUser);
            }
        }

        // 3. Create New User
        const newUser = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: email, // Might be null if not provided, but schema requires it. Google usually provides it.
            profilePhoto: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            // Generate valid random password since schema requires one if googleId is not present, 
            // but here googleId IS present, so line 21 of User.js says `required: function() { return !this.googleId; }` 
            // so we technically don't need a password!
            // But let's add a dummy hashed one just in case they try to login with email later (they would need to reset it)
            password: await bcrypt.hash(Math.random().toString(36).slice(-8) + Date.now(), 10),
            bio: "New to the community!"
        });

        await newUser.save();
        done(null, newUser);
    } catch (err) {
        console.error("Google Auth Error:", err);
        done(err, null);
    }
}));

module.exports = passport;
