const mongoose = require('mongoose');

/**
 * Cart Model - User's Shopping Cart
 * Supports multiple items, price snapshots
 */
const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item required']
  },
  name: {
    type: String,
    required: [true, 'Item name required'],
    trim: true
  },
  quantity: {
    type: Number,
    min: [1, 'Minimum quantity 1'],
    max: [99, 'Maximum 99 per item'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, 'Price required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    trim: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes

// Auto-calculate total
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  next();
});

// Indexes for performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.menuItem': 1 });

// Auto-calculate total
cartSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);

