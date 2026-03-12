const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: 50
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please add a valid email']
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  googleId: {
    type: String,
    sparse: true
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  avatar: {
    type: String
  },

  otp: {
    type: String,
    minlength: 6,
    maxlength: 6
  },

  otpExpires: {
    type: Date
  },

  isVerified: {
    type: Boolean,
    default: false
  }

},
{
  timestamps: true
});



// ============================
// HASH PASSWORD BEFORE SAVE
// ============================
userSchema.pre('save', async function (next) {

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});



// ============================
// MATCH PASSWORD METHOD
// ============================
userSchema.methods.matchPassword = async function (enteredPassword) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );

};



module.exports = mongoose.model('User', userSchema);