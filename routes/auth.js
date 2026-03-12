const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerUser,
  registerAdmin,
  login,
  verifyOTP,
  googleLogin
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// Signup user
router.post('/signup', [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], registerUser);

// Signup admin (unprotected for bootstrap, or use special key later)
router.post('/admin-signup', [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], registerAdmin);

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], verifyOTP);

// Google login
router.post('/google', [
  body('idToken').notEmpty().trim()
], googleLogin);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], login);

// Protected
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;


