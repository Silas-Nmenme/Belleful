const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config();

const connectDB = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      });
      console.log(`✅ MongoDB Connected (attempt ${attempt}) - Host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error('💥 All DB retries failed - continuing without DB (Vercel will log errors)');
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

module.exports = connectDB