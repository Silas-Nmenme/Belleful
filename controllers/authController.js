const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateOTP } = require('../utils/emailTemplates');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

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
  const { email, rawOtp } = req.body;
  const inputOTP = String(rawOtp || '').trim();
  
  if (!email || !rawOtp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }
  
  try {
    const user = await User.findOne({ email }).select('+otp otpExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    console.log('Stored OTP:', JSON.stringify({val: user.otp, type: typeof user.otp, len: user.otp?.length}), 
      'Input OTP:', JSON.stringify({val: inputOTP, type: typeof inputOTP, len: inputOTP.length}), 
      'Strict Match:', user.otp === inputOTP, 
      'Loose Match:', user.otp == inputOTP);

    if (user.otp != inputOTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });

    console.log('User verification saved:', { 
      id: user._id, 
      email: user.email, 
      isVerified: true 
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // OTP valid, send token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Verify OTP error:', error);
    if (error.message.includes('Missing credentials') || error.message.includes('Invalid login')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email service temporarily unavailable. Please try again in a few minutes.' 
      });
    }
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
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

// @desc    Google login/signup
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists by email (for linking)
      user = await User.findOne({ email });
      if (user) {
        // Link Google to existing user
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          googleId,
          isVerified: true,
        });
      }
    } else if (!user.isVerified) {
      // Rare: Google user not verified? Verify now
      user.isVerified = true;
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
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

