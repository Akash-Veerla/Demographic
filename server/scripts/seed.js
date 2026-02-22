/**
 * Unified Seed Script for KON-NECT
 * ----------------------------------
 * Seeds 80 users in AP & Telangana + 500 users across India = 580 total
 * Uses the 12 standard interests from config/Interests.json
 * Each user gets 2-5 random interests
 * 
 * Usage:  node server/seed.js
 * 
 * This will REMOVE all previously seeded users (email ending @seed.konnect)
 * before inserting new ones. Real users (who registered via the app) are untouched.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const FriendRequest = require('./models/FriendRequest');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('FATAL: MONGO_URI not found. Create a .env in the project root.');
    process.exit(1);
}

// ─────────────────────────────────── Interests ────────────────────────────────
const INTERESTS = require('./config/Interests.json');

// ─────────────────────────────────── Indian Names ─────────────────────────────
const MALE_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Ganesh", "Ravi", "Suresh", "Ramesh", "Venkatesh",
    "Srinivas", "Nagarjuna", "Pawan", "Mahesh", "Prabhas", "Ram", "Vijay",
    "Karthik", "Surya", "Vikram", "Dhanush", "Siddharth", "Abhi", "Balaji",
    "Chaitanya", "Deepak", "Gopi", "Harsh", "Jai", "Kunal", "Lokesh",
    "Manish", "Nikhil", "Om", "Pranav", "Rahul", "Sachin", "Tarun",
    "Uday", "Varun", "Yash", "Ankit", "Bharat", "Dhruv", "Gaurav",
    "Himanshu", "Ishan", "Jayesh", "Karan", "Lakshman", "Mohit", "Naveen",
    "Omkar", "Pradeep", "Rakesh", "Sandeep", "Tushar", "Utkarsh", "Vishal",
    "Akash", "Bhuvan", "Chirag", "Dev", "Ekansh", "Firoz", "Gopal",
    "Hemant", "Indrajit", "Jatin", "Kartik", "Lalit", "Mayank", "Neeraj",
    "Parth", "Rohan", "Sagar", "Tanmay", "Vijayendra", "Yogesh", "Zubair",
    "Arnav", "Darshan", "Farhan", "Girish", "Hitesh", "Kabir", "Madhav",
    "Navin", "Pratik", "Rajat", "Shubham", "Tejas", "Umesh", "Vinay"
];

const FEMALE_NAMES = [
    "Diya", "Saanvi", "Aditi", "Myra", "Ananya", "Pari", "Riya", "Aarya",
    "Anika", "Navya", "Lakshmi", "Samantha", "Kajal", "Rashmika", "Bhavya",
    "Chandana", "Deepika", "Esha", "Gitanjali", "Harini", "Indu", "Jaya",
    "Kavya", "Lavanya", "Meghana", "Nithya", "Padma", "Radha", "Sandhya",
    "Tejaswini", "Uma", "Vani", "Yamini", "Zara", "Amara", "Divya",
    "Gauri", "Isha", "Keerthi", "Mansi", "Neha", "Pooja", "Ritika",
    "Shreya", "Trisha", "Vidya", "Anushka", "Bhumi", "Charmi", "Durga",
    "Fatima", "Geeta", "Himani", "Janvi", "Komal", "Lata", "Meera",
    "Nandini", "Prerna", "Roshni", "Sakshi", "Tanya", "Urmi", "Vanshika",
    "Aishwarya", "Bela", "Charu", "Devika", "Ekta", "Falguni", "Gayatri",
    "Hema", "Indira", "Juhi", "Kiara", "Lekha", "Maitri", "Niharika",
    "Pallavi", "Rachana", "Shalini", "Tanvi", "Ujjwala", "Varsha",
    "Ankita", "Deepti", "Heena", "Jyoti", "Madhuri", "Priyanka", "Sonali",
    "Swati", "Shweta", "Sneha", "Suman", "Seema", "Rupal", "Reema"
];

const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

const BIOS = [
    "Exploring the world one step at a time.",
    "Passionate about learning new things every day.",
    "Love meeting new people and sharing ideas.",
    "Coffee addict and avid reader.",
    "Tech enthusiast building cool stuff.",
    "Nature lover and weekend trekker.",
    "Foodie on a mission to try everything.",
    "Music is my therapy.",
    "Always up for an adventure.",
    "Fitness freak and health nut.",
    "Photography is how I see the world.",
    "Film buff and binge-watcher.",
    "History nerd with a love for stories.",
    "Creative mind, artistic soul.",
    "Sports junkie, always game for a match.",
    "Travel lover, 15 states and counting!",
    "Business-minded and growth-oriented.",
    "Science geek at heart.",
    "Cars, bikes, and everything on wheels.",
    "Designing my way through life.",
    "Bookworm with too many wishlists.",
    "Living life one chai at a time.",
    "Weekend warrior, weekday dreamer.",
    "Making memories wherever I go.",
    "Just vibing through life. ✌️",
    "Future entrepreneur in the making.",
    "Love the mountains more than the beach.",
    "A smile is my favourite accessory.",
    "Lifelong student of everything.",
    "Home is where the heart is."
];

// ─────────────────────────── Geographic Regions ────────────────────────────────

// AP & Telangana (80 users) — denser, more realistic coordinates
const AP_TELANGANA_CITIES = [
    // Andhra Pradesh cities
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
    { name: "Vijayawada", lat: 16.5062, lng: 80.6480 },
    { name: "Guntur", lat: 16.3067, lng: 80.4365 },
    { name: "Nellore", lat: 14.4426, lng: 79.9865 },
    { name: "Kurnool", lat: 15.8281, lng: 78.0373 },
    { name: "Rajahmundry", lat: 17.0005, lng: 81.8040 },
    { name: "Kakinada", lat: 16.9891, lng: 82.2475 },
    { name: "Tirupati", lat: 13.6288, lng: 79.4192 },
    { name: "Anantapur", lat: 14.6819, lng: 77.6006 },
    { name: "Kadapa", lat: 14.4674, lng: 78.8241 },
    { name: "Eluru", lat: 16.7107, lng: 81.0952 },
    { name: "Ongole", lat: 15.5057, lng: 80.0499 },
    { name: "Srikakulam", lat: 18.2949, lng: 83.8938 },
    { name: "Machilipatnam", lat: 16.1875, lng: 81.1389 },
    { name: "Proddatur", lat: 14.7502, lng: 78.5481 },
    // Telangana cities
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { name: "Warangal", lat: 17.9784, lng: 79.5941 },
    { name: "Nizamabad", lat: 18.6725, lng: 78.0940 },
    { name: "Karimnagar", lat: 18.4386, lng: 79.1288 },
    { name: "Khammam", lat: 17.2473, lng: 80.1514 },
    { name: "Mahbubnagar", lat: 16.7488, lng: 77.9855 },
    { name: "Nalgonda", lat: 17.0575, lng: 79.2690 },
    { name: "Adilabad", lat: 19.6641, lng: 78.5320 },
    { name: "Suryapet", lat: 17.1405, lng: 79.6262 },
    { name: "Siddipet", lat: 18.1019, lng: 78.8520 },
    { name: "Miryalaguda", lat: 16.8740, lng: 79.5620 },
    { name: "Mancherial", lat: 18.8706, lng: 79.4583 },
    { name: "Ramagundam", lat: 18.7557, lng: 79.4746 },
    { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
    { name: "BHEL Township", lat: 17.4400, lng: 78.3400 },
];

// India-wide major cities (500 users spread across these)
const INDIA_CITIES = [
    // North India
    { name: "Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
    { name: "Amritsar", lat: 31.6340, lng: 74.8723 },
    { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
    { name: "Agra", lat: 27.1767, lng: 78.0081 },
    { name: "Varanasi", lat: 25.3176, lng: 82.9739 },
    { name: "Noida", lat: 28.5355, lng: 77.3910 },
    { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
    { name: "Prayagraj", lat: 25.4358, lng: 81.8463 },
    { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
    { name: "Shimla", lat: 31.1048, lng: 77.1734 },
    // West India
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Surat", lat: 21.1702, lng: 72.8311 },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
    { name: "Indore", lat: 22.7196, lng: 75.8577 },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
    { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
    { name: "Nashik", lat: 19.9975, lng: 73.7898 },
    { name: "Rajkot", lat: 22.3039, lng: 70.8022 },
    { name: "Goa", lat: 15.2993, lng: 74.1240 },
    // East India
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Patna", lat: 25.6093, lng: 85.1376 },
    { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
    { name: "Ranchi", lat: 23.3441, lng: 85.3096 },
    { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
    { name: "Siliguri", lat: 26.7271, lng: 88.3953 },
    { name: "Cuttack", lat: 20.4625, lng: 85.8830 },
    { name: "Jamshedpur", lat: 22.8046, lng: 86.2029 },
    // South India (excluding AP & TS already covered)
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Kochi", lat: 9.9312, lng: 76.2673 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
    { name: "Mysuru", lat: 12.2958, lng: 76.6394 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    { name: "Mangaluru", lat: 12.9141, lng: 74.8560 },
    { name: "Salem", lat: 11.6643, lng: 78.1460 },
    { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 },
    { name: "Kozhikode", lat: 11.2588, lng: 75.7804 },
    { name: "Thrissur", lat: 10.5276, lng: 76.2144 },
    { name: "Hubli", lat: 15.3647, lng: 75.1240 },
    { name: "Belgaum", lat: 15.8497, lng: 74.4977 },
    { name: "Pondicherry", lat: 11.9416, lng: 79.8083 },
];

// ─────────────────────────── Helper Functions ───────────────────────────────

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Jitter a city's coordinates by ±0.05 degrees (~5km) for realistic spread */
function jitter(value, range = 0.05) {
    return value + (Math.random() * 2 - 1) * range;
}

/** Pick 2-5 random interests from the 12 standard categories */
function getRandomInterests() {
    const count = Math.floor(Math.random() * 4) + 2; // 2..5
    const shuffled = [...INTERESTS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomName() {
    return pick(ALL_NAMES);
}

function getRandomBio() {
    return pick(BIOS);
}

// ─────────────────────────── Main Seed Function ──────────────────────────────

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clean up previously seeded users (identified by @seed.konnect email)
        const deleteResult = await User.deleteMany({ email: { $regex: /@seed\.konnect$/ } });
        console.log(`🗑  Removed ${deleteResult.deletedCount} previously seeded users`);

        // Also remove old ghost users and @example.com seed users from prior scripts
        const oldCleanup = await User.deleteMany({
            $or: [
                { userType: 'ghost' },
                { email: { $regex: /@example\.com$/ } }
            ]
        });
        if (oldCleanup.deletedCount > 0) {
            console.log(`🗑  Removed ${oldCleanup.deletedCount} old ghost/example users`);
        }

        // Clean up any friend requests involving deleted users
        const allUserIds = (await User.find({}, '_id')).map(u => u._id);
        await FriendRequest.deleteMany({
            $or: [
                { from: { $nin: allUserIds } },
                { to: { $nin: allUserIds } }
            ]
        });

        // 2. Hash a common password once (efficient — all seed users share this)
        const hashedPassword = await bcrypt.hash('Konnect@Seed2026', 10);
        console.log('🔐 Password hashed');

        const users = [];

        // ─── A. 80 users in AP & Telangana ──────────────────────────────
        console.log('\n📍 Seeding AP & Telangana (80 users)...');
        for (let i = 0; i < 80; i++) {
            const city = pick(AP_TELANGANA_CITIES);
            const name = getRandomName();
            users.push({
                displayName: name,
                email: `ap_ts_${i}_${Date.now()}@seed.konnect`,
                password: hashedPassword,
                bio: getRandomBio(),
                interests: getRandomInterests(),
                userType: 'user',
                authMethod: 'local',
                isActive: true,
                lastLogin: new Date(Date.now() - Math.floor(Math.random() * 48 * 60 * 60 * 1000)),
                location: {
                    type: 'Point',
                    coordinates: [jitter(city.lng), jitter(city.lat)]
                },
                profilePhoto: null
            });
        }

        // ─── B. 500 users across India ──────────────────────────────────
        console.log('📍 Seeding rest of India (500 users)...');
        for (let i = 0; i < 500; i++) {
            const city = pick(INDIA_CITIES);
            const name = getRandomName();
            users.push({
                displayName: name,
                email: `india_${i}_${Date.now()}@seed.konnect`,
                password: hashedPassword,
                bio: getRandomBio(),
                interests: getRandomInterests(),
                userType: 'user',
                authMethod: 'local',
                isActive: true,
                lastLogin: new Date(Date.now() - Math.floor(Math.random() * 72 * 60 * 60 * 1000)),
                location: {
                    type: 'Point',
                    coordinates: [jitter(city.lng, 0.08), jitter(city.lat, 0.08)]
                },
                profilePhoto: null
            });
        }

        // 3. Insert all at once
        await User.insertMany(users);
        console.log(`\n✅ Successfully seeded ${users.length} users total:`);
        console.log(`   • 80 in Andhra Pradesh & Telangana`);
        console.log(`   • 500 across India`);
        console.log(`\n📊 Total users in DB: ${await User.countDocuments()}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
