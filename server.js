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
app.use(express.static(path.join(__dirname, 'public'))); // Serve dashboards

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

// Basic route - now serves dashboards
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')) || res.send('Belleful Dashboards Ready');
});

// Start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server + Socket.IO running on http://localhost:${PORT}`);
    console.log(`CORS Allowed origins: ${FRONTEND_URL}`);
  });
}).catch((error) => {
  console.error("MongoDB Connection Failed:", error.message);
  process.exit(1);
});
