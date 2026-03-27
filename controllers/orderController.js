const Order = require('../models/Order');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../services/emailService');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

/**
 * Order Controller - Checkout & Lifecycle Management
 */

// ===== CREATE ORDER (Checkout) =====
exports.checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart empty' });
    }

    // Validate stock
    for (let item of cart.items) {
      if (item.menuItem.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${item.menuItem.name} insufficient stock`
        });
      }
    }

    // Validate delivery method
    const { deliveryMethod, deliveryAddress, phoneNumber, bankAccount, bankName } = req.body;
    if (!deliveryMethod || !['pickup', 'delivery'].includes(deliveryMethod)) {
      return res.status(400).json({ success: false, message: 'deliveryMethod must be "pickup" or "delivery"' });
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress required for delivery' });
    }
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber required' });
    }
    if (!bankAccount || !bankName) {
      return res.status(400).json({ success: false, message: 'bankAccount and bankName required' });
    }

    const orderData = {
      user: req.user._id,
      items: cart.items.map(item => ({
        menuItem: item.menuItem._id,
        name: item.menuItem.name,
        price: item.price,
        quantity: item.quantity
      })),
      totalAmount: cart.totalAmount,
      deliveryMethod,
      phoneNumber,
      bankAccount,
      bankName
    };

    if (deliveryMethod === 'delivery') {
      orderData.deliveryAddress = deliveryAddress;
    }

    const order = await Order.create(orderData);

    // Decrement stock
    for (let item of cart.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Email
    await sendOrderConfirmation(order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
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

    const orders = await Order.find({ user: req.user._id })
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`Found ${orders.length} orders`);

    // Defensive data cleaning
    // Ultra-safe serialization - handle ALL potential undefined numerics
    const safeOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Ensure totalAmount is safe
      orderObj.totalAmount = Number(orderObj.totalAmount) || 0;
      
      // Safe items processing
      orderObj.items = (orderObj.items || []).map(item => {
        const itemObj = item.toObject ? item.toObject() : item;
        console.log('Processing item:', { 
          name: itemObj.name, 
          price: itemObj.price, 
          menuItem: !!itemObj.menuItem,
          hasToFixed: typeof itemObj.price === 'object' && itemObj.price?.toFixed
        });
        
        // Comprehensive price safety
        let safePrice = 0;
        if (typeof itemObj.price === 'number') {
          safePrice = itemObj.price;
        } else if (typeof itemObj.price === 'string') {
          safePrice = parseFloat(itemObj.price) || 0;
        } else if (itemObj.price && typeof itemObj.price === 'object' && itemObj.price.toFixed) {
          safePrice = parseFloat(itemObj.price.toFixed(2)) || 0;
        }
        
        return {
          ...itemObj,
          price: safePrice,
          totalAmount: Number(itemObj.totalAmount) || 0,
          menuItem: itemObj.menuItem || null
        };
      });
      
      return orderObj;
    });

    console.log(`✅ Orders API completed: ${safeOrders.length} safe orders`);
    res.json({ success: true, data: safeOrders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: error.message });
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

