const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validationResult } = require('express-validator');

/**
 * Auth Routes - Registration, Login, OAuth
 */

// Validation chains
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// ===== PUBLIC ROUTES =====
router.post('/register', registerValidation, authController.register);
router.post('/admin-register', registerValidation, authController.registerAdmin);
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP code').isNumeric()
], authController.verifyOTP);

router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Google OAuth
router.get('/google', authController.googleOAuth);
router.get('/google/callback', authController.googleCallback);

// ===== PROTECTED =====
router.get('/profile', auth, authController.getProfile);

module.exports = router;

