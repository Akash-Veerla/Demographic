const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

// Configuration
const ADDRESS_CSV_PATH = path.join(__dirname, '../../Address.csv');
const GHOST_COUNT = 80;

async function seedGhosts() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is missing in environment variables.");
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        console.log(`Reading addresses from: ${ADDRESS_CSV_PATH}`);
        const fileContent = fs.readFileSync(ADDRESS_CSV_PATH, 'utf-8');
        const records = parse(fileContent, { columns: true, skip_empty_lines: true });

        // Filter for AP (Latitude roughly 12.5-19.0, Longitude 77.0-84.5)
        const apRecords = records.filter(r => {
            const lat = parseFloat(r.Latitude);
            const lng = parseFloat(r.Longitude);
            return lat >= 12.5 && lat <= 19.0 && lng >= 77.0 && lng <= 84.5;
        });

        if (apRecords.length === 0) throw new Error("No valid AP addresses found in CSV.");

        const ghostPassword = await bcrypt.hash('Konnect@Ghost1', 10);
        const ghosts = [];

        // Core Interests from first row of Interests.csv logic
        const coreInterests = ['Technology', 'Arts', 'Food', 'Business', 'Sports', 'Music', 'Movies', 'Travel', 'Health', 'Science', 'Fashion', 'Gaming'];

        for (let i = 0; i < GHOST_COUNT; i++) {
            const record = apRecords[Math.floor(Math.random() * apRecords.length)];

            ghosts.push({
                displayName: `Ghost User ${i + 1}`,
                email: `ghost_${i + 1}@konnect.app`,
                password: ghostPassword,
                userType: 'ghost',
                authMethod: 'local',
                isActive: true,
                lastLogin: new Date(),
                availabilityStatus: 'Available',
                bio: "Automated test profile for proximity clustering.",
                interests: [coreInterests[Math.floor(Math.random() * coreInterests.length)]],
                location: {
                    type: "Point",
                    coordinates: [parseFloat(record.Longitude), parseFloat(record.Latitude)]
                }
            });
        }

        console.log(`Generated ${ghosts.length} ghost users. Seeding DB...`);
        // Use insertMany to ensure we don't hit duplicate key errors if previous ghosts were left behind
        // though the reset script should have handled it.
        await User.insertMany(ghosts);

        console.log('Cluster Seeded: 80 Ghosts Active');
        process.exit(0);
    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
}

seedGhosts();
