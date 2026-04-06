const Order = require('../models/Order');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../services/emailService');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

/**
 * Order Controller - Checkout & Lifecycle Management
 */

// ===== CREATE ORDER (Checkout) =====
exports.checkout = async (req, res) => {
  try {
    const { cartSnapshot, grandTotal, phoneNumber, bankAccount, bankName, deliveryAddress } = req.body;
    
    let cart;
    
    if (cartSnapshot && cartSnapshot.items && cartSnapshot.items.length > 0) {
      // Validate snapshot items and stock
      for (let item of cartSnapshot.items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem || menuItem.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `${item.name} insufficient stock` });
        }
      }
      // Create mock cart from snapshot
      cart = {
        items: cartSnapshot.items.map(i => ({
          menuItem: { _id: i.menuItem },
          name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        grandTotal: grandTotal || 0,
        deliveryType: cartSnapshot.deliveryPreference || 'pickup'
      };
      console.log('Using validated cartSnapshot:', cart.items.length, 'items');
    } else {
      // Fallback to DB cart
      cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart empty' });
      }
    }

    // Validate form fields
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber required' });
    }
    if (!bankAccount || !bankName) {
      return res.status(400).json({ success: false, message: 'bankAccount and bankName required' });
    }
    const deliveryMethod = cart.deliveryType;
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress required for delivery orders' });
    }

    const orderData = {
      user: req.user._id,
      items: cart.items.map(item => ({
        menuItem: item.menuItem._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: cart.grandTotal,
      deliveryMethod: cart.deliveryType,
      phoneNumber,
      bankAccount,
      bankName
    };

    if (cart.deliveryType === 'delivery') {
      orderData.deliveryAddress = deliveryAddress;
    }

    const order = await Order.create(orderData);

    // Decrement stock
    for (let item of cart.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear DB cart if exists
    if (cart._id) {
      await Cart.findByIdAndUpdate(cart._id, { items: [], grandTotal: 0 });
    }

    // Email
    await sendOrderConfirmation(order);

    res.status(201).json({ success: true, data: order.toJSON({ virtuals: true }) });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== GET USER ORDERS =====
exports.getMyOrders = async (req, res) => {
  try {
    console.log('getMyOrders called for user:', req.user?._id);
    
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User ID missing' });
    }

    let orders;
    try {
      orders = await Order.find({ user: new mongoose.Types.ObjectId(req.user._id) })
        .populate('items.menuItem', 'name image')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      console.log(`Found ${orders?.length || 0} orders`);
    } catch (populateErr) {
      console.error('Populate failed:', populateErr);
      orders = [];
    }

    // Defensive data cleaning
    const safeOrders = (orders || []).map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount) || 0,
      items: (order.items || []).map(item => ({
        ...item,
        price: Number(item.price) || 0,
        menuItem: item.menuItem || null
      }))
    }));

    console.log(`✅ Orders API completed: ${safeOrders.length} safe orders`);
    res.json({ success: true, data: safeOrders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Unable to load orders at this time' });
  }
};

// ===== ADMIN: ALL ORDERS =====
exports.getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, page = 1, dateFrom } = req.query;
    const query = {};
    
    if (status) query.orderStatus = status;
    if (dateFrom) query.createdAt = { $gte: new Date(dateFrom) };

    const orders = await Order.find(query)
      .populate('user', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== UPDATE STATUS (Admin) =====
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('user');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    await order.save();

    // Notify customer
    await sendOrderStatusUpdate(order, status);

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

