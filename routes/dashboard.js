const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

/**
 * Dashboard Routes - Stats & Analytics
 */
router.use(auth);

router.get('/user/stats', dashboardController.getUserStats);
router.get('/user/orders', require('../controllers/orderController').getMyOrders);

router.use(isAdmin);
router.get('/admin/stats', dashboardController.getAdminStats);
router.get('/admin/top-items', dashboardController.getTopItems);
router.get('/admin/users', async (req, res) => {
  // List users for admin
  const users = await require('../models/User').find({}).select('-password');
  res.json({ success: true, data: users });
});

module.exports = router;

