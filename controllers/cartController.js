const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

// @desc Add to cart
exports.addToCart = [auth, async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;

  try {
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem || !menuItem.available) {
      return res.status(404).json({ success: false, message: 'Menu item not available' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [{
          menuItem: menuItemId,
          quantity,
          price: menuItem.price
        }],
        totalAmount: menuItem.price * quantity
      });
    } else {
      // Check if item already in cart
      const existingItemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].price = menuItem.price; // snapshot
      } else {
        cart.items.push({
          menuItem: menuItemId,
          quantity,
          price: menuItem.price
        });
      }
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    await cart.save();
    res.status(201).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get cart
exports.getCart = [auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.menuItem', 'name price image');
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Remove from cart
exports.removeFromCart = [auth, async (req, res) => {
  const { menuItemId } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.menuItem.toString() !== menuItemId);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

