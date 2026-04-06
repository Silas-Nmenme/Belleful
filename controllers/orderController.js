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
    console.log('Checkout payload:', { 
      hasCartSnapshot: !!req.body.cartSnapshot, 
      hasUser: !!req.user?._id,
      grandTotal: req.body.grandTotal 
    });
    
    const { cartSnapshot, grandTotal, phoneNumber, bankAccount, bankName, deliveryAddress, deliveryMethod: clientDeliveryMethod } = req.body;
    
    // 1. Auth check
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // 2. Validate required fields FIRST
    if (!phoneNumber?.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!bankAccount?.trim() || !bankName?.trim()) {
      return res.status(400).json({ success: false, message: 'Bank account number and bank name are required' });
    }
    
    // 3. Get/validate cart - more robust
    let cartItems = [];
    let finalDeliveryMethod = clientDeliveryMethod || 'pickup';
    
    if (cartSnapshot?.items?.length) {
      // Validate frontend snapshot
      console.log('Validating cartSnapshot:', cartSnapshot.items.length, 'items');
      for (let item of cartSnapshot.items) {
        const menuItemId = item.menuItem?._id || item.menuItem;
        if (!menuItemId || !item.name || typeof item.quantity !== 'number' || item.quantity < 1 || typeof item.price !== 'number' || item.price <= 0) {
          return res.status(400).json({ success: false, message: `Invalid item: ${item.name || 'Unknown'} - check quantity/price/menuItem ID` });
        }
        
        // Convert string ID to ObjectId if needed
        let validId = menuItemId;
        if (typeof menuItemId === 'string') {
          try {
            validId = new mongoose.Types.ObjectId(menuItemId);
          } catch {
            return res.status(400).json({ success: false, message: `Invalid menuItem ID: ${menuItemId}` });
          }
        }
        
        const menuItem = await MenuItem.findById(validId);
        if (!menuItem) {
          return res.status(400).json({ success: false, message: `Menu item not found: ${item.name}` });
        }
        if (menuItem.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `${item.name} - only ${menuItem.stock} available (need ${item.quantity})` });
        }
        
        cartItems.push({
          menuItem: validId,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity
        });
      }
      finalDeliveryMethod = cartSnapshot.deliveryPreference || 'pickup';
    } else {
      // Fallback DB cart
      const dbCart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
      if (!dbCart?.items?.length) {
        return res.status(400).json({ success: false, message: 'No items in cart. Add items from menu first.' });
      }
      cartItems = dbCart.items.map(item => ({
        menuItem: item.menuItem._id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity
      }));
      finalDeliveryMethod = dbCart.deliveryPreference || 'pickup';
    }
    
    if (!cartItems.length) {
      return res.status(400).json({ success: false, message: 'No valid cart items found' });
    }
    
    if (finalDeliveryMethod === 'delivery' && !deliveryAddress?.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address required' });
    }
    
    const calculatedTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderTotal = Number(grandTotal) || calculatedTotal;
    
    // 4. Create order with EXPLICIT status
    const orderData = {
      user: req.user._id,
      items: cartItems,
      totalAmount: orderTotal,
      deliveryMethod: finalDeliveryMethod,
      phoneNumber: phoneNumber.trim(),
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim(),
      orderStatus: 'pending_approval'  // EXPLICIT - was defaulting incorrectly
    };
    
    if (finalDeliveryMethod === 'delivery') {
      orderData.deliveryAddress = deliveryAddress.trim();
    }
    
    const order = await Order.create(orderData);
    
    // 5. Update stock & clear cart
    for (let item of cartItems) {
      await MenuItem.findByIdAndUpdate(item.menuItem, { $inc: { stock: -item.quantity } });
    }
    
    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { 
      $set: { items: [], grandTotal: 0, subtotal: 0 } 
    }).exec();
    
    // 6. Email (fire and forget)
    sendOrderConfirmation(order).catch(console.error);
    
    // 7. Return FULL populated order
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name image price')
      .lean();
    
    console.log(`✅ Order created: #${populatedOrder.displayId} for user ${req.user.email}`);
    
    res.status(201).json({ 
      success: true, 
      data: populatedOrder 
    });
    
  } catch (error) {
    console.error('Checkout ERROR:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Checkout failed - please try again',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

