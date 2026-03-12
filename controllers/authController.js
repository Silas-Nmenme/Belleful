const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateOTP } = require('../utils/emailTemplates');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

// Get token from model, create cookie & send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production' };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Find user
    const user = await User.findOne({ email }).select('+otp otpExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Verify success
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(email, user.name);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.registerUser = async (req, res, next) => {
  let { name, email, password } = req.body;

  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user with OTP
    const user = await User.create({ 
      name, 
      email, 
      password, 
      otp, 
      otpExpires 
    });

    // Send OTP email
    await sendOTPEmail(email, name, otp);

    res.status(201).json({ 
      success: true, 
      message: 'User registered. Please check your email for OTP to verify.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register admin (admin only signup)
exports.registerAdmin = async (req, res, next) => {
  let { name, email, password } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate OTP for admin too
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'admin',
      otp, 
      otpExpires 
    });

    // Send OTP email
    await sendOTPEmail(email, name, otp);

    res.status(201).json({ 
      success: true, 
      message: 'Admin registered. Please check your email for OTP to verify.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & admin
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first with OTP' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

