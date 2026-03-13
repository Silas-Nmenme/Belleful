const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  getAdminOrders,
  getUserStats,
  getUserOrders,
  getUserProfile,
  getUserCart,
  getUserPayments
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// ===== ADMIN ROUTES =====
router.get('/admin/stats', auth, isAdmin, getAdminStats);
router.get('/admin/users', auth, isAdmin, getUsers);
router.get('/admin/orders', auth, isAdmin, getAdminOrders);

// ===== USER ROUTES - FULL DASHBOARD =====
router.get('/user/stats', auth, getUserStats);
router.get('/user/orders', auth, getUserOrders);
router.get('/user/profile', auth, getUserProfile);
router.get('/user/cart', auth, getUserCart);
router.get('/user/payments', auth, getUserPayments);

module.exports = router;

