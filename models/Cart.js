const mongoose = require('mongoose');

/**
 * Cart Model - User's Shopping Cart
 * Supports multiple items, price snapshots
 */
const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: String, // Snapshot
  quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  price: { // Snapshot
    type: Number,
    required: true
  },
  image: String // Snapshot for display
});

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

// Methods
cartSchema.methods.addItem = async function(menuItemId, quantity = 1) {
  // Implementation in controller
};

cartSchema.methods.clear = function() {
  this.items = [];
  this.totalAmount = 0;
};

module.exports = mongoose.model('Cart', cartSchema);

