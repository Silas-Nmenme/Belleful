require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('../config/database.js');
const path = require('path');

// Connect to DB
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100 // 100 req per window
});

// Serve static frontend files
app.use(express.static('../public'));

app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/menu', require('../routes/menu'));
app.use('/api/cart', require('../routes/cart'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/payments', require('../routes/payments'));

// Socket.io - Temporarily disabled for Vercel serverless (use Pusher later)
// TODO: Replace with WebSocket service like Pusher/Ably

// Health
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK', message: 'Belleful Backend Running on Vercel' }));

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

// Vercel serverless export
module.exports = app;

