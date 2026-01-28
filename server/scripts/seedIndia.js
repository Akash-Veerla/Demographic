require('dotenv').config({ path: '../../.env' }); // Adjust path to root .env
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/User'); // Adjust path to User model

// Hardcoded URI as fallback if .env fails in this specific script context context
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://konnect-admin:konnect123@cluster0.mongodb.net/konnect?retryWrites=true&w=majority";

const INTERESTS_LIST = [
    'Coding', 'Design', 'Music', 'Travel', 'Food', 'Gaming', 'Reading', 'Fitness',
    'Photography', 'Art', 'Movies', 'Tech', 'Startups', 'Nature', 'Dancing',
    'Writing', 'History', 'Science', 'Yoga', 'Hiking'
];

async function seedUsers() {
    try {
        console.log('🌱 Connectivity Check...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        console.log('🧹 Clearing existing users...');
        await User.deleteMany({ email: { $ne: 'admin@konnect.com' } }); // Keep admin if exists
        console.log('✅ Setup Clean');

        const users = [];
        const NUM_USERS = 80;

        // Andhra Pradesh Bounding Box
        // Lat: 12.5 - 19.0
        // Lng: 77.0 - 84.5
        const LAT_MIN = 12.5;
        const LAT_MAX = 19.0;
        const LNG_MIN = 77.0;
        const LNG_MAX = 84.5;

        console.log(`🚀 Generating ${NUM_USERS} users in AP Region...`);

        for (let i = 0; i < NUM_USERS; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const displayName = `${firstName} ${lastName}`;
            const email = faker.internet.email({ firstName, lastName }).toLowerCase();

            // Generate random interests (1-4)
            const numInterests = Math.floor(Math.random() * 4) + 1;
            const shuffled = INTERESTS_LIST.sort(() => 0.5 - Math.random());
            const selectedInterests = shuffled.slice(0, numInterests); // Array of strings

            // Generate Location in AP Box
            const lat = LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN);
            const lng = LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN);

            users.push({
                googleId: `seed_${faker.string.uuid()}`,
                displayName,
                email,
                profilePhoto: faker.image.avatar(),
                bio: faker.person.bio(),
                interests: selectedInterests,
                location: {
                    type: 'Point',
                    coordinates: [lng, lat] // GeoJSON is [lng, lat]
                },
                lastLogin: new Date() // Force Online Now
            });
        }

        await User.insertMany(users);
        console.log(`✨ Successfully seeded ${users.length} users!`);
        console.log('📍 Location Distribution: Andhra Pradesh (Lat: 12.5-19.0, Lng: 77.0-84.5)');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seedUsers();
