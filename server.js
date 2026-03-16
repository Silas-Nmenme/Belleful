require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database.js');
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");


const app = express();

// ===== ENV VALIDATION =====
const requiredEnvVars = [
  'MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 
  'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required ENV vars:', missingVars.join(', '));
  console.error('Add to Vercel dashboard: Project Settings > Environment Variables');
  process.exit(1);
}
console.log('✅ All required ENV vars present');

const PORT = process.env.PORT || 3500;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app';


// ===== 2. SECURITY & PARSERS =====
app.use(helmet()); // Security headers

// ===== Middleware =====
app.use(express.json());   // JSON body parser
app.use(morgan("dev"));

// CORS - allows frontend requests
app.use(cors({
  origin: [FRONTEND_URL, 'https://bellefulchop.netlify.app'],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Body parsers (increased limit for images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== Serve static files (for local testing only) =====
app.use(express.static(path.join(__dirname, "public")));

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ===== API ROUTES ===== (Auth protected where needed)
app.get("/", (req, res) => res.send("Welcome To Belleful API"));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ===== GLOBAL ERROR HANDLER (AFTER ROUTES) =====
app.use((err, req, res, next) => {
  console.error('🚨 Global Error:', err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


// ===== START SERVER =====
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in serverless
});

// Handle unhandled exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

connectDB().then(() => {

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
  });
}).catch((error) => {
  console.error('MongoDB Connection Failed:', error.message);
  process.exit(1);
});
