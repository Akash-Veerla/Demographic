const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const User = require('../models/User');
const INTERESTS = require('../config/Interests.json');

require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Point to root .env
// Or if running from server/scripts: path: '../.env'

function distance(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }
}

const INDIAN_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Diya", "Saanvi", "Aditi", "Myra", "Ananya", "Pari", "Riya", "Aarya", "Anika", "Navya",
    "Ravi", "Suresh", "Ramesh", "Lakshmi", "Venkatesh", "Srinivas", "Nagarjuna", "Chiranjeevi", "Pawan",
    "Mahesh", "Prabhas", "Allu", "Ram", "NTR", "Vijay", "Samantha", "Kajal", "Tamannaah", "Rashmika",
    "Priya", "Rahul", "Amit", "Sneha", "Karan", "Pooja", "Vikram", "Neha", "Sanjay", "Meera"
];

const BIOS = [
    "Tech enthusiast looking for coding buddies.",
    "Weekend hiker and nature lover.",
    "Coffee addict and bookworm.",
    "Always up for a game of badminton.",
    "Foodie exploring the best local eats.",
    "Musician looking for jam sessions.",
    "Startup founder networking for ideas.",
    "Digital nomad exploring the city.",
    "Art lover visiting galleries.",
    "Fitness freak, join me for a run!",
    "Movie buff and pop culture nerd.",
    "Just here to make new friends."
];

const seedGhosts = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is missing in environment variables.");
            // Try to load from default location if process.env is empty (for manual run)
            const envPath = path.resolve(__dirname, '../.env');
            if (fs.existsSync(envPath)) {
                require('dotenv').config({ path: envPath });
            }
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Load Addresses
        const addresses = [];
        const addressFilePath = path.join(__dirname, '../../Address.csv'); // Root/Address.csv

        console.log(`Reading addresses from: ${addressFilePath}`);

        await new Promise((resolve, reject) => {
            fs.createReadStream(addressFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    const lat = parseFloat(row.latitude);
                    const lng = parseFloat(row.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        addresses.push({ lat, lng, city: row.district || row.officename });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Loaded ${addresses.length} valid addresses.`);

        // Select 80 random addresses (or first 80 unique locations)
        // Shuffle to get good distribution
        const selectedAddresses = addresses.sort(() => 0.5 - Math.random()).slice(0, 80);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Konnect@Ghost1', salt);

        const users = [];

        for (let i = 0; i < selectedAddresses.length; i++) {
            const addr = selectedAddresses[i];
            const firstName = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
            const lastName = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
            const fullName = `${firstName} ${lastName}`; // Simple random name generator

            // Interest Assignment Logic
            let userInterests = [];

            // Check nearby users already generated to bias interests
            const nearbyUsers = users.filter(u => {
                const d = distance(u.location.coordinates[1], u.location.coordinates[0], addr.lat, addr.lng);
                return d <= 50; // 50km radius
            });

            if (nearbyUsers.length > 0 && Math.random() < 0.3) {
                // 30% chance to share interest with a neighbor
                const randomNeighbor = nearbyUsers[Math.floor(Math.random() * nearbyUsers.length)];
                if (randomNeighbor.interests.length > 0) {
                    userInterests.push(randomNeighbor.interests[Math.floor(Math.random() * randomNeighbor.interests.length)]);
                }
            }

            // Fill remaining interests randomly (1-3 interests total)
            const numInterests = Math.floor(Math.random() * 3) + 1;
            while (userInterests.length < numInterests) {
                const randomInterest = INTERESTS[Math.floor(Math.random() * INTERESTS.length)];
                if (!userInterests.includes(randomInterest)) {
                    userInterests.push(randomInterest);
                }
            }

            users.push({
                displayName: fullName,
                email: `ghost_${i + 1}@konnect.app`,
                password: hashedPassword,
                profilePhoto: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
                bio: BIOS[Math.floor(Math.random() * BIOS.length)],
                interests: userInterests,
                location: {
                    type: 'Point',
                    coordinates: [addr.lng, addr.lat]
                },
                isActive: true,
                lastLogin: new Date(),
                availabilityStatus: 'Available'
            });
        }

        console.log(`Generated ${users.length} ghost users. Seeding DB...`);
        await User.insertMany(users);
        console.log(`Cluster Seeded: ${users.length} Ghosts Active`);

        process.exit(0);

    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
};

seedGhosts();
