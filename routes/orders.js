const express = require('express');
const router = express.Router();
const {
  checkout,
  getMyOrders,
  getOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

router.post('/checkout', auth, checkout);
router.get('/myorders', auth, getMyOrders);
router.get('/', auth, isAdmin, getOrders);
router.patch('/:id', auth, isAdmin, updateOrderStatus);

module.exports = router;


