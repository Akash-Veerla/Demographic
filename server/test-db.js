require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('ERROR: MONGO_URI not found in .env');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
// Mask credentials for log safety if outputting, but here we just want to know if it works.
console.log(`URI: ${mongoUri.split('@')[1] ? '...With Credentials...' : mongoUri}`);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILURE: Could not connect to MongoDB.');
    console.error(err);
    process.exit(1);
  });
