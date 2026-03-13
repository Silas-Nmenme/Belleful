const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  getAdminOrders,
  getUserStats,
  getUserOrders
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// ===== ADMIN ROUTES =====
router.get('/admin/stats', auth, isAdmin, getAdminStats);
router.get('/admin/users', auth, isAdmin, getUsers);
router.get('/admin/orders', auth, isAdmin, getAdminOrders);

// ===== USER ROUTES =====
router.get('/user/stats', auth, getUserStats);
router.get('/user/orders', auth, getUserOrders);

module.exports = router;

