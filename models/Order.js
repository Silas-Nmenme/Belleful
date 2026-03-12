const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: String,
  quantity: Number,
  price: Number
});

const orderStatusEnum = ['ordered', 'pending_approval', 'vendor_approved', 'preparing', 'ready', 'off_for_delivery', 'delivered'];

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentReference: String,
  receiptImage: String, // Cloudinary URL
  orderStatus: {
    type: String,
    enum: orderStatusEnum,
    default: 'ordered'
  },
  accountNumber: String,
  bankName: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

