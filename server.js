require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app';
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

// ===== Create HTTP Server =====
const server = http.createServer(app);

// ===== Socket.IO Setup =====
const io = new socketIo.Server(server, {
  cors: {
    origin: ['https://bellefulchop.netlify.app'],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    socket.user = decoded; // {id, role}
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.user.id}`);
  
  // Join user or admin room
  if (socket.user.role === 'admin') {
    socket.join('admin');
    console.log(`Admin ${socket.user.id} joined admin room`);
  } else {
    socket.join(`user_${socket.user.id}`);
    console.log(`User ${socket.user.id} joined user_${socket.user.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.user?.id || 'unknown'}`);
  });
});

// Attach io to app for utils/socket.js getIo(req)
app.set('io', io);

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'https://bellefulchop.netlify.app'],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100 // 100 req per window
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Explicit preflight handler
app.options('*', cors({
  origin: [FRONTEND_URL, 'https://bellefulchop.netlify.app'],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// API root
app.get('/', (req, res) => res.json({ message: 'Belleful Chop API' }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));


// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on dev, but log
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception - continuing in serverless mode:', error);
  // Don't exit - serverless compatibility
});

// Start DB and server (server always starts)
connectDB().catch(console.error); // Fire and forget

server.listen(PORT, () => {
console.log(`Belleful API running on port ${PORT}`);
});
