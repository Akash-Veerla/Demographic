require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Message = require('../models/Message');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mapData');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const interestsPool = ['Coding', 'Travel', 'Food', 'Philosophy', 'Art', 'Music', 'Hiking', 'Tech', 'Business', 'Reading'];

const generateRandomLocation = (centerLat, centerLon, radiusKm) => {
    const r = radiusKm * 1000;
    const rEarth = 6378000;
    const dx = (Math.random() - 0.5) * 2 * r;
    const dy = (Math.random() - 0.5) * 2 * r;
    const newLat = centerLat + (dy / rEarth) * (180 / Math.PI);
    const newLon = centerLon + (dx / rEarth) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
    return [newLon, newLat];
};

const seed = async () => {
    await connectDB();
    await User.deleteMany({});
    await Connection.deleteMany({});
    await Message.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const mainUser = await User.create({
        name: 'Main Tester',
        email: 'test@example.com',
        password: hashedPassword,
        bio: 'I am the main tester.',
        interests: ['Coding', 'Tech'],
        location: { type: 'Point', coordinates: [-0.1278, 51.5074] }
    });
    console.log(`Created Main User: ${mainUser.email}`);

    const users = [];
    for (let i = 0; i < 20; i++) {
        const coords = generateRandomLocation(51.5074, -0.1278, 8);
        const randomInterests = [];
        while (randomInterests.length < 3) {
            const int = interestsPool[Math.floor(Math.random() * interestsPool.length)];
            if (!randomInterests.includes(int)) randomInterests.push(int);
        }
        users.push({
            name: `User ${i + 1}`,
            email: `user${i}@example.com`,
            password: hashedPassword,
            bio: 'Just a random seed user.',
            interests: randomInterests,
            location: { type: 'Point', coordinates: coords }
        });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} seed users.`);

    await Connection.create({ requester: mainUser._id, recipient: createdUsers[0]._id, status: 'accepted' });
    console.log('Created 1 friendship for Main User.');

    await mongoose.connection.close();
    process.exit();
};

seed();
