const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require('passport'); // Import Passport
require('./auth/google'); // Import Google Strategy Config

const User = require('./models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');

// --- Shared CORS Origin Helper ---
function isAllowedOrigin(origin) {
    if (!origin) return true; // Allow server-to-server / same-origin
    const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://localhost:5000', 'http://localhost:3000'].filter(Boolean);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
        return true;
    }
    return false;
}

function corsOriginHandler(origin, callback) {
    if (isAllowedOrigin(origin)) {
        return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
}


// --- Global Error Handling to Prevent Crash on Auth Fail ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Do not exit process
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Do not exit process
});

// --- Database Connection ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error('FATAL: MONGO_URI environment variable is not defined. DB-dependent routes will fail.');
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: corsOriginHandler,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

if (mongoUri) {
    console.log("Attempting to connect to MongoDB Atlas...");
    mongoose.connect(mongoUri)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => {
            console.error('MongoDB Connection Error:', err.message);
            console.error('The server will remain running but DB-dependent routes will fail.');
        });
}

console.log("CORS allowed for: " + (process.env.CLIENT_URL || '(CLIENT_URL not set — only localhost allowed)'));

// --- Middleware ---
app.use(cors({
    origin: corsOriginHandler,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Fix for Path-to-Regexp wildcard crash in Express 5+ / new libs
// Using named wildcard '*path' is the standard Express 5 way to match everything
app.options('*path', cors());

app.use(express.json());
app.set('trust proxy', 1); // Required for Render to handle secure cookies correctly
app.use(passport.initialize());

// --- Auth Routes ---

// Explicitly exempt from any global auth middleware (mounted at root level)
app.use('/api/auth', authRoutes);

// --- Auth Middleware (JWT) ---
const requireAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains { id: ... }
        req.user.id = decoded.id; // Compatibility alias
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// --- Socket.io Logic ---
// Map<socketId, userId> to track active connections
const socketToUser = new Map();

io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('register_user', async (userId) => {
        if (!userId) return;
        socketToUser.set(socket.id, userId);
        socket.join(userId); // Join a room named after the userId for private messaging
        console.log(`Socket ${socket.id} mapped to User ${userId}`);

        // Trigger an initial broadcast for this user
        broadcastNearbyUsers(socket, userId);
    });

    socket.on('update_location', async (data) => {
        // data: { lat, lng }
        const userId = socketToUser.get(socket.id);
        if (!userId || !data) return;

        try {
            // Update DB
            await User.findByIdAndUpdate(userId, {
                location: {
                    type: 'Point',
                    coordinates: [data.lng, data.lat]
                },
                lastLogin: new Date()
            });
            // Broadcast new nearby users
            broadcastNearbyUsers(socket, userId);
        } catch (err) {
            console.error('Error updating location:', err);
        }
    });

    socket.on('join_chat', async ({ targetUserId }) => {
        const currentUserId = socketToUser.get(socket.id);
        if (!currentUserId) return;

        try {
            const currentUser = await User.findById(currentUserId);
            const fromName = currentUser ? currentUser.displayName : 'User';

            const roomId = [currentUserId, targetUserId].sort().join('_');
            socket.join(roomId);

            // Find the target user's socket(s)
            io.to(targetUserId).emit('chat_request', {
                from: currentUserId,
                fromName,
                roomId
            });
            socket.emit('chat_joined', { roomId });
        } catch (err) {
            console.error('Error joining chat:', err);
        }
    });

    socket.on('accept_chat', ({ roomId }) => {
        socket.join(roomId);
    });

    socket.on('send_message', ({ roomId, message }) => {
        const userId = socketToUser.get(socket.id);
        io.to(roomId).emit('receive_message', {
            text: message,
            senderId: userId,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        socketToUser.delete(socket.id);
        console.log('Client disconnected', socket.id);
    });

    socket.on('getting_directions', async ({ targetUserId }) => {
        const currentUserId = socketToUser.get(socket.id);
        if (!currentUserId) return;
        try {
            const currentUser = await User.findById(currentUserId);
            const fromName = currentUser ? currentUser.displayName : 'Someone';
            io.to(targetUserId).emit('directions_alert', {
                fromName,
                message: `${fromName} is getting directions to your location!`
            });
        } catch (err) {
            console.error(err);
        }
    });
});

// --- New API Routes for Dynamic Discovery ---

// Get Nearby Users (Dynamic Radius)
app.get('/api/users/nearby', requireAuth, async (req, res) => {
    try {
        const { lat, lng, radius, interests } = req.query;
        const userId = req.user.id;

        if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
            return res.status(400).json({ error: 'Valid Latitude and Longitude required' });
        }

        const maxDistance = (radius ? Math.min(parseFloat(radius), 50) : 10) * 1000; // Max 50km, convert to meters

        // Find users within radius (exclude self)
        const nearbyUsers = await User.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistance
                }
            },
            'location.coordinates': { $ne: [0, 0] }, // Null Guard
            isActive: { $ne: false },
            _id: { $ne: userId }
        }).select('displayName email interests location profilePhoto bio lastLogin isActive');

        // Map with Online Status
        const usersWithStatus = nearbyUsers.map(u => ({
            ...u.toObject(),
            isOnline: (io.sockets.adapter.rooms.get(u._id.toString())?.size || 0) > 0
        }));

        // Optional Interest Filtering
        let filteredUsers = usersWithStatus;
        if (interests && interests !== 'all') {
            const userInterests = interests.split(',');
            filteredUsers = usersWithStatus.filter(u =>
                u.interests.some(i => userInterests.includes(typeof i === 'string' ? i : i.name))
            );
        }

        res.json(filteredUsers);
    } catch (err) {
        console.error('Error fetching nearby users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Temporary Seeding Route (Protected by simple secret)
app.get('/api/admin/seed', async (req, res) => {
    const { secret } = req.query;
    if (secret !== 'KONNECT_SECRET_SEED') {
        return res.status(403).json({ error: 'Unauthorized access to seeding' });
    }

    try {
        console.log('Starting remote seeding (Land Only)...');
        const bcrypt = require('bcryptjs');

        // Clear existing seed users
        await User.deleteMany({ email: { $regex: /@example\.com$/ } });
        console.log('Cleared previous seed users');

        // Andhra Pradesh Bounding Box
        const LAT_MIN = 12.5;
        const LAT_MAX = 19.0;
        const LNG_MIN = 77.0;
        const LNG_MAX = 84.5;

        const NAMES = [
            "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
            "Diya", "Saanvi", "Aditi", "Myra", "Ananya", "Pari", "Riya", "Aarya", "Anika", "Navya",
            "Ganesh", "Ravi", "Suresh", "Ramesh", "Lakshmi", "Venkatesh", "Srinivas", "Nagarjuna", "Chiranjeevi", "Pawan",
            "Mahesh", "Prabhas", "Allu", "Ram", "NTR", "Vijay", "Samantha", "Kajal", "Tamannaah", "Rashmika"
        ];

        // Use canonical interests list (same source as validation + API)
        const SEED_INTERESTS = require('./config/Interests.json');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = [];

        for (let i = 0; i < 80; i++) {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)] + " " + NAMES[Math.floor(Math.random() * NAMES.length)];

            // Random Interests
            const numInterests = Math.floor(Math.random() * 4) + 1;
            const shuffled = [...SEED_INTERESTS].sort(() => 0.5 - Math.random());
            const selectedInterests = shuffled.slice(0, numInterests);

            // Random Location in AP Box
            const lat = LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN);
            const lng = LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN);

            users.push({
                googleId: `remote_seed_${i}_${Date.now()}`,
                displayName: name,
                email: `user${i}_${Date.now()}@konnect.com`,
                password: hashedPassword,
                profilePhoto: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
                bio: "Generated User from AP Region",
                interests: selectedInterests,
                lastLogin: new Date(),
                location: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            });
        }

        await User.insertMany(users);
        res.json({ message: `Seeded ${users.length} users in Andhra Pradesh region!` });

    } catch (err) {
        console.error('Seeding failed:', err);
        res.status(500).json({ error: 'Seeding failed', details: err.message });
    }
});

// Get Global Users (For when no one is nearby or explicit global search)
app.get('/api/users/global', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { interests } = req.query;

        // Fetch users globally (exclude self)
        // No limits for Global View as per request "All the users in the database should be shown"
        // But let's keep a reasonable safety limit if DB is huge (e.g. 500) or just return all?
        // User said "All the users". I will use a high limit.
        let query = {
            _id: { $ne: userId },
            'location.coordinates': { $ne: [0, 0] }, // Null Guard
            isActive: { $ne: false } // Availability logic
        };

        const globalUsers = await User.find(query)
            .sort({ lastLogin: -1 })
            .limit(500)
            .select('displayName email interests location profilePhoto bio lastLogin isActive');

        // Map with Online Status
        const usersWithStatus = globalUsers.map(u => ({
            ...u.toObject(),
            isOnline: (io.sockets.adapter.rooms.get(u._id.toString())?.size || 0) > 0
        }));

        let filteredUsers = usersWithStatus;
        if (interests && interests !== 'all') {
            const userInterests = interests.split(',');
            filteredUsers = usersWithStatus.filter(u =>
                u.interests && u.interests.some(i => userInterests.includes(typeof i === 'string' ? i : i.name))
            );
        }

        res.json(filteredUsers);
    } catch (err) {
        console.error('Error fetching global users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


async function broadcastNearbyUsers(socket, userId) {
    // Deprecated in favor of REST API for map polling/radius, 
    // but kept for initial socket connection if needed.
    // For now, doing nothing to avoid conflicting with the new frontend logic
    // which handles fetching data via API.
}


// --- Routes ---
// Health Check for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/current_user', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// User Updates - Protected
app.post('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const { displayName, bio, profilePhoto, availabilityStatus } = req.body;
        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (bio) updateData.bio = bio;
        if (profilePhoto) updateData.profilePhoto = profilePhoto;

        // Map Availability Status to isActive
        if (availabilityStatus) {
            updateData.availabilityStatus = availabilityStatus;
            updateData.isActive = availabilityStatus !== 'Invisible';
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

const INTERESTS_LIST = require('./config/Interests.json');

app.post('/api/user/interests', requireAuth, async (req, res) => {
    try {
        const { interests } = req.body; // Expecting array of strings

        if (!interests || !Array.isArray(interests)) {
            return res.status(400).json({ error: 'Interests must be an array' });
        }

        // Sanitize: trim whitespace, remove empties, cap at 20
        const sanitized = interests
            .map(i => (typeof i === 'string' ? i.trim() : ''))
            .filter(Boolean)
            .slice(0, 20);

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { interests: sanitized },
            { new: true }
        ).select('-password');
        res.send(updatedUser);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Interests - Served from canonical JSON (single source of truth)
console.log(`Interests loaded: ${INTERESTS_LIST.length} items from Interests.json`);

app.get('/api/interests', requireAuth, (req, res) => {
    res.json(INTERESTS_LIST);
});

// Change Password
app.post('/api/user/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Please provide both current and new passwords' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify current password
        const isMatch = await require('bcryptjs').compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await require('bcryptjs').genSalt(10);
        user.password = await require('bcryptjs').hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error("Password update error:", err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Delete Account
app.delete('/api/user/delete', requireAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// --- Stats Route ---
app.get('/api/stats/local', requireAuth, async (req, res) => {
    try {
        let { lat, lng } = req.query;
        const userId = req.user.id;

        // If no coords provided, try to use user's stored location
        if (!lat || !lng) {
            const currentUser = await User.findById(userId);
            if (currentUser && currentUser.location && currentUser.location.coordinates) {
                lng = currentUser.location.coordinates[0];
                lat = currentUser.location.coordinates[1];
            }
        }

        // If still no coords or invalid, return zeros early to prevent crash
        if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)) || (parseFloat(lat) === 0 && parseFloat(lng) === 0)) {
            return res.json({ activeNearby: 0, matchedInterestsNearby: 0 });
        }

        const centerCoords = [parseFloat(lng), parseFloat(lat)];
        const maxDistance = 10000; // 10km

        // 1. Active Nearby Count (Last 24h)
        const activeNearby = await User.countDocuments({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: centerCoords },
                    $maxDistance: maxDistance
                }
            },
            'location.coordinates': { $ne: [0, 0] },
            lastLogin: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            _id: { $ne: userId }
        });

        // 2. Matched Interests Count (Active or Inactive)
        const currentUser = await User.findById(userId).select('interests');
        const userInterests = currentUser.interests || [];

        let matchedInterestsNearby = 0;
        if (userInterests.length > 0) {
            matchedInterestsNearby = await User.countDocuments({
                location: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: centerCoords },
                        $maxDistance: maxDistance
                    }
                },
                'location.coordinates': { $ne: [0, 0] },
                interests: { $in: userInterests },
                _id: { $ne: userId }
            });
        }

        // 3. Top Interests Pulse (50km Radius)
        const pulseDistance = 50000; // 50km
        const topInterestsRaw = await User.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: centerCoords },
                    distanceField: "dist.calculated",
                    maxDistance: pulseDistance,
                    query: {
                        'location.coordinates': { $ne: [0, 0] },
                        isActive: { $ne: false },
                        _id: { $ne: userId } // Exclude self
                    },
                    includeLocs: "dist.location",
                    spherical: true
                }
            },
            { $unwind: "$interests" },
            { $group: { _id: "$interests", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        const topInterests = topInterestsRaw.map(i => ({ category: i._id, count: i.count }));

        res.json({ activeNearby, matchedInterestsNearby, topInterests });

    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
