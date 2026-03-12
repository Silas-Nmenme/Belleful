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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp } = req.body;
    const inputOTP = String(otp || '').trim();

    if (!email || !inputOTP || inputOTP.length !== 6 || !/^\d{6}$/.test(inputOTP)) {
      return res.status(400).json({ success: false, message: "Valid email and 6-digit OTP required" });
    }

    // Find user with valid OTP
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      otpExpires: { $gt: new Date() }
    }).select('+otp otpExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request new one." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    // Normalize & compare OTPs
    const storedOTP = (user.otp || '').trim();
    const numericStored = parseInt(storedOTP, 10);
    const numericInput = parseInt(inputOTP, 10);

    // Detailed logging
    console.log('OTP Verification:', {
      email,
      storedOTP,
      storedLength: storedOTP.length,
      storedNumeric: numericStored,
      inputOTP,
      inputLength: inputOTP.length,
      inputNumeric: numericInput,
      strictMatch: storedOTP === inputOTP,
      numericMatch: numericStored === numericInput && !isNaN(numericStored)
    });

    const isValidOTP = storedOTP === inputOTP || (numericStored === numericInput && !isNaN(numericStored));

    if (!isValidOTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ User verified: ${user.email}`);

    // Send welcome email (fire & forget)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Send auth token
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};





// @desc    Register user
// @route   POST /api/auth/signup  
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { name, email, password } = req.body;

    // Check existing
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const user = await User.create({ 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      otp,
      otpExpires 
    });

    // Send OTP
    await sendOTPEmail(email, name, otp);

    res.status(201).json({ 
      success: true, 
      message: 'User created! Check email for verification OTP.' 
    });
  } catch (error) {
    console.error('Register error:', error);
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

