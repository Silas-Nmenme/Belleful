const express = require('express');
const router = express.Router({ mergeParams: true });
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

/**
 * Cart Routes - Auth required
 */
router.use(auth);
router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.delete('/:itemId', cartController.removeFromCart);
router.patch('/:itemId', cartController.updateQuantity);
router.delete('/clear', cartController.clearCart);

module.exports = router;

