const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { getPaymentDetails } = require('../services/paymentService');
const { sendNewOrderEmail, sendOrderStatusUpdateEmail } = require('../services/emailService');

const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// @desc Checkout - create order from cart
exports.checkout = [auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.menuItem');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart empty' });
    }

    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price
    }));

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      accountNumber: process.env.BANK_ACCOUNT || '8107586167',
      bankName: process.env.BANK_NAME || 'Opay'
    });

    const createdOrder = await order.save();

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user.id });

    await sendNewOrderEmail(createdOrder); // Email notification to admin (socket removed)

    const paymentDetails = getPaymentDetails(createdOrder);

    res.status(201).json({ success: true, data: createdOrder, paymentDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get user orders
exports.getMyOrders = [auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.menuItem', 'name').sort('-createdAt');
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get all orders (admin)
exports.getOrders = [auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').populate('items.menuItem', 'name').sort('-createdAt');
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Update order status/payment (admin)
exports.updateOrderStatus = [auth, isAdmin, async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  try {
    const order = await Order.findById(req.params.id).populate('user', 'id');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus || order.orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    const updatedOrder = await order.save();

    // Email notification to user (real-time socket removed)
    sendOrderStatusUpdateEmail(updatedOrder, order.orderStatus).catch(console.error);

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

