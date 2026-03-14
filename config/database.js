const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error('Database connection error (continuing without DB):', error.message);
    // Don't exit - allow server start for Vercel health checks
  }
};

module.exports = connectDB;

