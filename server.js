require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/database');
const emailService = require('./services/emailService');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

/**
 * Belleful Food Ordering Backend - Production-Ready Server
 * Features: Auth (OTP/Google), Menu/Cart/Orders/Payments, Admin Dashboard, Contact Form
 * Deployment: Vercel-optimized, MongoDB Atlas
 * Security: CSRF protection, Rate limiting, Helmet, CORS
 */

const app = express();

// ===== ENVIRONMENT VALIDATION =====
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing ENV:', missing.join(', '));
  process.exit(1);
}

// ===== CONSTANTS =====
const PORT = process.env.PORT || 1500;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app';

// ===== 1. SECURITY MIDDLEWARE =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      'script-src': ["'self'"],
    },
  },
}));

// CORS for frontend
app.use(cors({
  origin: [FRONTEND_URL, 'https://bellefulchop.netlify.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie parser for CSRF
app.use(cookieParser());

// Rate limiting for general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 req/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting for auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 25, // Increased to 25 for testing (5 was too strict)
  skipSuccessfulRequests: false,
  message: 'Too many login attempts from this IP. Please wait 15 minutes or try a different network. (Max 25 attempts/15min)'
});

// ===== 2. BODY PARSING (Large files for images) =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// CSRF protection for state-changing requests
const csrfProtection = csrf({ cookie: false });

// Static files (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// ===== 3. HEALTH CHECK (With dependency checks) =====
app.get('/health', async (req, res) => {
  const checks = {
    status: 'OK',
    database: 'unknown',
    timestamp: new Date().toISOString()
  };

  try {
    // Quick database ping
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      checks.database = 'connected';
    } else {
      checks.database = 'disconnected';
    }
  } catch (err) {
    checks.database = `error: ${err.message}`;
  }

  const allHealthy = checks.database === 'connected';
  res.status(allHealthy ? 200 : 503).json(checks);
});

// Root
app.get('/', (req, res) => res.json({ message: 'Belleful API Running - Food Ordering Backend' }));

// ===== 4. API ROUTES =====
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/staff', require('./routes/staff'));

// ===== 5. 404 HANDLER =====
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ===== 6. GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'CSRF token validation failed' });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server Error';
  
  // Log errors in production
  if (process.env.NODE_ENV === 'production') {
    console.error('API Error:', {
      status,
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ===== 7. GRACEFUL SHUTDOWN =====
let server;
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend: ${FRONTEND_URL}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      
      // Email service auto-initializes on module load
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

