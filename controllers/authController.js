const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendOTPEmail, sendWelcomeEmail, sendTemplateEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

// Create JWT token & send response
const sendTokenResponse = (user, statusCode, res) => {

  const token = jwt.sign(
    { id: user._id, email: user.email, provider: user.provider || 'local' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1d' }
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
        role: user.role,
        provider: user.provider || 'local'
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



// Initiate Google OAuth - Generate OAuth URL
exports.initiateGoogleAuth = async (req, res) => {
  // Validate required env vars first
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = (process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL)?.trim() || 'https://belleful-fphf.vercel.app/api/users/google/callback';

  if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID missing from .env');
    return res.status(500).json({ 
      message: 'Google OAuth misconfigured: GOOGLE_CLIENT_ID missing. Check .env file.' 
    });
  }
  
  if (!clientSecret) {
    console.error('❌ GOOGLE_CLIENT_SECRET missing from .env');
    return res.status(500).json({ 
      message: 'Google OAuth misconfigured: GOOGLE_CLIENT_SECRET missing. Check .env file.' 
    });
  }
  
  if (!redirectUri) {
    console.error('❌ GOOGLE_REDIRECT_URI missing from .env');
    return res.status(500).json({ 
      message: 'Google OAuth misconfigured: GOOGLE_REDIRECT_URI missing. Check .env file.' 
    });
  }

  console.log(`✅ Google OAuth config validated: clientId=${clientId.slice(0,20)}..., redirect=${redirectUri}`);

  try {
  console.log(`🔧 Creating OAuth2 client with redirect: ${redirectUri}`);
  
  // DEBUG: Log exact config before OAuth2 constructor
  console.log('🔍 OAuth2 CONFIG DEBUG:', {
    clientId: clientId ? `${clientId.slice(0,20)}...` : 'MISSING',
    clientSecret: clientSecret ? `${clientSecret.slice(0,10)}***` : 'MISSING',
    redirectUri,
    typeofOAuth2Client: typeof OAuth2Client,
    OAuth2ClientKeys: OAuth2Client ? Object.keys(OAuth2Client) : 'OAuth2Client undefined'
  });
    

    
// Fixed: v10+ OAuth2Client uses positional args: new OAuth2Client(clientId, clientSecret, redirectUri)
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Generate auth URL
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      state: JSON.stringify({
        timestamp: Date.now(),
        redirectUri // Extra state for security
      })
    });

    console.log('✅ OAuth URL generated successfully');
    return res.status(200).json({
      success: true,
      message: "Google OAuth URL generated",
      authUrl: authorizeUrl,
      config: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        redirectUri,
        clientIdPreview: clientId ? `${clientId.slice(0,20)}...` : 'MISSING'
      }
    });

  } catch (error) {
    console.error("❌ OAuth2 Error Details:", {
      message: error.message,
      code: error.code,
      clientIdPreview: clientId ? `${clientId.slice(0,20)}...` : 'MISSING',
      redirectUri,
      stack: error.stack
    });
    return res.status(500).json({ 
      message: 'Failed to generate OAuth URL',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Configuration error',
      hint: '1. Check .env vars match Google Cloud Console exactly\n2. Verify redirect URI registered\n3. Restart server after .env changes'
    });
  }
};

// Handle Google OAuth Callback
exports.handleGoogleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ message: "OAuth authorization denied", error });
  }

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  try {
    
    // DEBUG: Same check for callback
    console.log('🔍 Callback OAuth2Client init');
    
    // Fixed: v10+ OAuth2Client positional args (consistent)
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || 'https://belleful-fphf.vercel.app/api/users/google/callback'
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info using built-in method (no separate googleapis needed)
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture: avatar,
      email_verified: emailVerified
    } = payload;

    if (!emailVerified) {
      return res.status(400).json({ message: "Google email not verified" });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;
    
    if (!user) {
      // Check if user exists with this email (regular signup)
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.provider = 'google';
        user.avatar = avatar;
        user.isVerified = true;
        await user.save();
      } else {
        // Create new user with Google OAuth
        user = new User({
          name,
          email,
          googleId,
          provider: 'google',
          avatar,
          isVerified: true
        });
        await user.save();
        isNewUser = true;

        // Send welcome email for new Google users
        const welcomeHtml = emailTemplates.googleWelcomeTemplate(name);
        await sendTemplateEmail(
          email,
          'Welcome to Belleful - Google Signup!',
          welcomeHtml
        );
      }
    }

    // Generate JWT token
    const jwtPayload = {
      id: user._id,
      email: user.email,
      provider: user.provider
    };
    
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    });

    // Send response (no cookie for callback, frontend handles)
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({ message: "Google authentication failed" });
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