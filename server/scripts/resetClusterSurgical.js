const mongoose = require('mongoose');
const path = require('path');
// This ensures we look for .env in the /server folder specifically
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const ADMIN_EMAIL = "akashveerla0@gmail.com";

async function resetClusterSurgical() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in .env. Please check your server/.env file.");
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // 1. Tag the Admin first to ensure they aren't deleted by accident
        const admin = await User.findOne({ email: ADMIN_EMAIL });
        if (admin) {
            admin.userType = 'admin';
            await admin.save();
            console.log(`Admin account confirmed: ${ADMIN_EMAIL}`);
        } else {
            console.log("Warning: Admin email not found in current DB. No users protected.");
        }

        // 2. Delete everyone EXCEPT the admin
        console.log('Wiping legacy users...');
        const result = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
        console.log(`Deleted ${result.deletedCount} legacy users.`);

        // 3. Drop and Rebuild Geospatial Index
        console.log('Rebuilding location index...');
        try {
            await User.collection.dropIndex('location_2dsphere');
        } catch (e) {
            // Index might not exist, that's fine
        }
        await User.createIndexes();

        console.log('Surgical Reset Complete. Admin preserved.');
        process.exit(0);
    } catch (error) {
        console.error('Surgical Reset Failed:', error);
        process.exit(1);
    }
}

resetClusterSurgical();
