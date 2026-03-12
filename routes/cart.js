const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart
} = require('../controllers/cartController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', addToCart);
router.get('/', getCart);
router.delete('/:menuItemId', removeFromCart);

module.exports = router;


