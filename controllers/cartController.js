const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

/**
 * Cart Controller - Add/Remove/View Items
 * Auto price snapshots, stock checks
 */

// ===== GET CART =====
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
    
    if (!cart) {
      cart = new Cart({ user: req.user._id });
      await cart.save();
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ADD ITEM =====
exports.addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem || !menuItem.available || menuItem.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item unavailable or insufficient stock' 
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    // Check existing item
    const existingIndex = cart.items.findIndex(item => 
      item.menuItem.toString() === menuItemId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        image: menuItem.image
      });
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== REMOVE ITEM =====
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart empty' });

    cart.items = cart.items.filter(item => 
      item.menuItem.toString() !== req.params.itemId
    );
    
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE QUANTITY =====
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => 
      item.menuItem.toString() === req.params.itemId
    );

    if (itemIndex === -1 || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid item or quantity' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== CLEAR CART =====
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

