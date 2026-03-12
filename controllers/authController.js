const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

// Create JWT token & send response
const sendTokenResponse = (user, statusCode, res) => {

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

// Generate 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};



// =====================================
// VERIFY OTP - REWRITTEN FOR ROBUSTNESS
// =====================================
exports.verifyOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Normalize inputs strictly
    const normalizedEmail = email.toLowerCase().trim();
    const inputOTP = String(otp).trim().padStart(6, '0');
    
    if (!/^\d{6}$/.test(inputOTP)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be exactly 6 digits"
      });
    }

    // Query user with required fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+otp +otpExpires +isVerified');

    // 1. User must exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email"
      });
    }

    console.log(`🔍 Verify attempt for ${user.email}: inputOTP=${inputOTP}, storedOTP=${user.otp}, isVerified=${user.isVerified}, expires=${user.otpExpires}`);

    // 2. Must not be already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }

    // 3. OTP must be set
    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "No verification code sent to this email. Please register again."
      });
    }

    // 4. OTP must match (both strings)
    if (user.otp !== inputOTP) {
      console.log(`❌ OTP mismatch: stored='${user.otp}' vs input='${inputOTP}'`);
      return res.status(400).json({
        success: false, 
        message: "Invalid verification code"
      });
    }

    // 5. OTP must not be expired
    const now = new Date();
    if (!user.otpExpires || user.otpExpires < now) {
      console.log(`❌ OTP expired: expires=${user.otpExpires}, now=${now}`);
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Please request a new one."
      });
    }

    // Clear OTP and verify user atomically
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ User verified: ${user.email}`);

    // Send welcome email (fire and forget)
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Welcome email failed:', err.message)
    );

    // Send JWT token
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification"
    });
  }
};




// =====================================
// REGISTER USER
// =====================================
exports.registerUser = async (req,res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors:errors.array()
      });
    }

    let { name, email, password } = req.body;

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success:false,
        message:"User already exists"
      });
    }

    const otp = exports.generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      otp,
      otpExpires
    });

    await sendOTPEmail(email,name,otp);

    res.status(201).json({
      success:true,
      message:"User registered. Check your email for OTP."
    });

  } catch(error) {

    console.error("Register error:", error);

    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};



// =====================================
// REGISTER ADMIN
// =====================================
exports.registerAdmin = async (req,res) => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors:errors.array()
      });
    }

    let { name,email,password } = req.body;

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success:false,
        message:"User already exists"
      });
    }

    const otp = exports.generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password,
      role:'admin',
      otp,
      otpExpires
    });

    await sendOTPEmail(email,name,otp);

    res.status(201).json({
      success:true,
      message:"Admin registered. Verify your email with OTP."
    });

  } catch(error) {

    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};



// =====================================
// GOOGLE LOGIN
// =====================================
exports.googleLogin = async (req,res) => {

  try {

    const { idToken } = req.body;

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience:process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const { sub:googleId,email,name } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {

      user = await User.findOne({ email });

      if (user) {

        user.googleId = googleId;
        user.isVerified = true;

        await user.save();

      } else {

        user = await User.create({
          name: name || email.split('@')[0],
          email,
          googleId,
          isVerified:true
        });

      }
    }

    sendTokenResponse(user,200,res);

  } catch(error) {

    console.error("Google auth error:",error);

    res.status(401).json({
      success:false,
      message:"Invalid Google token"
    });
  }
};



// =====================================
// LOGIN
// =====================================
exports.login = async (req,res) => {

  try {

    const { email,password } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors:errors.array()
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password');

    if (!user || !(await user.matchPassword(password))) {

      return res.status(401).json({
        success:false,
        message:"Invalid email or password"
      });
    }

    if (!user.isVerified) {

      return res.status(401).json({
        success:false,
        message:"Please verify your email with OTP first"
      });
    }

    sendTokenResponse(user,200,res);

  } catch(error) {

    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};