const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    default: 'General Inquiry',
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'ready'],
    default: 'unread'
  },
  replies: [{
    replyText: {
      type: String,
      required: true,
      maxlength: 1000
    },
    repliedBy: {
      type: String,
      default: 'Admin'
    },
    repliedAt: {
      type: Date,
      default: Date.now
    },
    emailSent: {
      type: Boolean,
      default: false
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);

