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

// Distance Helper (Haversine-like)
function distance(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) return 0;
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) dist = 1;
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    return dist; // Km
}

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
            const lat = parseFloat(r.latitude);
            const lng = parseFloat(r.longitude);
            return !isNaN(lat) && !isNaN(lng) && lat >= 12.5 && lat <= 19.0 && lng >= 77.0 && lng <= 84.5;
        });

        if (apRecords.length === 0) throw new Error("No valid AP addresses found in CSV.");

        const ghostPassword = await bcrypt.hash('Konnect@Ghost1', 10);
        const ghosts = [];

        // Core Interests from first row of Interests.csv logic
        const coreInterests = ['Technology', 'Arts', 'Food', 'Business', 'Sports', 'Music', 'Movies', 'Travel', 'Health', 'Science', 'Fashion', 'Gaming'];

        for (let i = 0; i < GHOST_COUNT; i++) {
            const record = apRecords[Math.floor(Math.random() * apRecords.length)];
            const lat = parseFloat(record.latitude);
            const lng = parseFloat(record.longitude);

            // Interest Selection with Clustering Bias
            let selectedInterest;
            const nearbyGhosts = ghosts.filter(g => {
                // g.location.coordinates is [lng, lat]
                const d = distance(g.location.coordinates[1], g.location.coordinates[0], lat, lng);
                return d <= 50; // 50km
            });

            if (nearbyGhosts.length > 0 && Math.random() < 0.3) {
                // 30% chance: Adopt interest from a neighbor (Cluster Effect)
                // This creates realistic pockets of similar interests
                const neighbor = nearbyGhosts[Math.floor(Math.random() * nearbyGhosts.length)];
                selectedInterest = neighbor.interests[0];
            } else {
                // Random interest
                selectedInterest = coreInterests[Math.floor(Math.random() * coreInterests.length)];
            }

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
                interests: [selectedInterest],
                location: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            });
        }

        console.log(`Generated ${ghosts.length} ghost users with clustering bias. Seeding DB...`);
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
