const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

const ADMIN_EMAIL = "akashveerla0@gmail.com";

const resetClusterSurgical = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log(`Starting Surgical Reset. Preserving Admin: ${ADMIN_EMAIL}`);

        // 1. Delete all users EXCEPT Admin
        const deleteResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
        console.log(`Deep Clean: Removed ${deleteResult.deletedCount} users.`);

        // 2. Locate Admin and Upgrade
        const adminUser = await User.findOne({ email: ADMIN_EMAIL });
        if (adminUser) {
            console.log('Admin Account Found. Upgrading privileges...');
            adminUser.userType = 'admin';
            adminUser.interests = []; // Optional: Reset admin interests or keep
            await adminUser.save();
            console.log('Admin privileges granted.');
        } else {
            console.warn(`WARNING: Admin account (${ADMIN_EMAIL}) not found. You may need to register it manually.`);
        }

        // 3. Rebuild Indexes
        console.log('Rebuilding Database Indexes...');

        // Check if index exists before dropping to avoid error
        const indexes = await User.collection.indexes();
        const locationIndex = indexes.find(idx => idx.name === 'location_2dsphere');

        if (locationIndex) {
            await User.collection.dropIndex('location_2dsphere');
            console.log('Dropped old location index.');
        }

        await User.createIndexes(); // Re-creates all indexes defined in Schema
        console.log('Indexes Recreated Successfully.');

        console.log('Surgical Reset Complete. Cluster is clean and Admin is secured.');
        process.exit(0);

    } catch (err) {
        console.error('Surgical Reset Failed:', err);
        process.exit(1);
    }
};

resetClusterSurgical();
