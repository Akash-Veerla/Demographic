const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

const resetCluster = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Wiping User collection...');
        await User.deleteMany({});
        console.log('User collection wiped.');

        console.log('Dropping indexes...');
        await User.collection.dropIndexes();
        console.log('Indexes dropped.');

        console.log('Recreating indexes...');
        await User.createIndexes(); // This will recreate the schema-defined indexes (location: 2dsphere)
        console.log('Indexes recreated.');

        console.log('Cluster Reset Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Reset Failed:', err);
        process.exit(1);
    }
};

resetCluster();
