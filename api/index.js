require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('../config/database.js');
const path = require('path');


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


// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Belleful API');
});


// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
  });
}).catch((error) => {
  console.error("MongoDB Connection Failed:", error.message);
  process.exit(1);
});

