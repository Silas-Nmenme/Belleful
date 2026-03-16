require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database.js');

const app = express();
const PORT = process.env.PORT || 1400;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app';


// ===== 2. SECURITY & PARSERS =====
app.use(helmet()); // Security headers

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



// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ===== API ROUTES ===== (Auth protected where needed)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ===== START SERVER =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
  });
}).catch((error) => {
  console.error('MongoDB Connection Failed:', error.message);
  process.exit(1);
});
