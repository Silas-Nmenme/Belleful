const Order = require('../models/Order');
const { sendOrderStatusUpdate } = require('../services/emailService');

/**
 * Staff Controller - Limited Order Management
 * Staff can: view pending/preparing orders, update to preparing/ready_for_pickup
 */

// ===== STAFF: PENDING/PREPARING ORDERS =====
exports.getPendingOrders = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const query = {
      orderStatus: { $in: ['pending_approval', 'preparing'] }
    };

    const orders = await Order.find(query)
      .populate('user', 'name phoneNumber email')
      .populate('items.menuItem', 'name price image')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Staff getPendingOrders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== STAFF: LIMITED STATUS UPDATE =====
// Allowed: pending_approval → preparing, preparing → ready_for_pickup
exports.updateStatusLimited = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!Order.schema.path('orderStatus').enumValues.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status: ${status}. Staff can only use: preparing, ready_for_pickup` 
      });
    }

    const order = await Order.findById(orderId)
      .populate('user', 'name email phoneNumber')
      .populate('items.menuItem', 'name price image');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = order.orderStatus;

    // Staff permissions check
    const allowedTransitions = {
      'pending_approval': ['preparing'],
      'preparing': ['ready_for_pickup']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(403).json({ 
        success: false, 
        message: `Staff cannot change ${currentStatus} to ${status}. Allowed: ${allowedTransitions[currentStatus]?.join(', ') || 'none'}` 
      });
    }

    // Update
    order.orderStatus = status;
    await order.save();

    // Notify
    sendOrderStatusUpdate(order, status).catch(console.error);

    res.json({ 
      success: true, 
      message: `Order #${order.displayId} updated to "${status.replace('_', ' ')}"`,
      data: order 
    });
  } catch (error) {
    console.error('Staff updateStatusLimited error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


