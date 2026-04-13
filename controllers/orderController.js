const Order = require('../models/Order');
const fs = require('fs');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');
const { sendOrderConfirmation, sendOrderAdminNotification, sendOrderStatusUpdate } = require('../services/emailService');
const { formatOrdersData, generatePDF, generateDOCX, generateCSV } = require('../utils/exportUtils');
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
    
    await Cart.findOneAndUpdate({ user: req.user._id }, { 
      $set: { items: [], grandTotal: 0, subtotal: 0 } 
    }).exec();
    
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email phoneNumber')
      .populate('items.menuItem', 'name image price')
      .lean();

    // 6. Email notifications
    sendOrderConfirmation(populatedOrder).catch(console.error);
    sendOrderAdminNotification(populatedOrder).catch(console.error);
    
    // 7. Return FULL populated order
    
    console.log(`Order created: #${populatedOrder.displayId} for user ${req.user.email}`);
    
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

    console.log(`Orders API completed: ${safeOrders.length} safe orders`);
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

// ===== GET SINGLE ORDER (Admin View) =====
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('items.menuItem', 'name price image')
      .lean();
      
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Admin-only access
if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== UPDATE STATUS (Admin) =====
exports.updateStatus = async (req, res) => {
  try {
    const { status: clientStatus } = req.body;
    const orderId = req.params.id;
    
    console.log(`🔄 Status update requested: ${orderId} → ${clientStatus}`);
    
    // 1. Validate ObjectId format (24 hex chars) - FIX 400 on malformed IDs
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error(`Invalid ObjectId format: ${orderId} (expected 24 hex chars)`);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid order ID format: ${orderId}. Must be valid 24-character hex ID.`,
        receivedId: orderId 
      });
    }
    
    // 2. Schema enum validation
    const validStatuses = [
      'pending_payment', 'pending_approval', 'preparing', 
      'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'
    ];
    
    // Legacy mapping for frontend compatibility
    const statusMap = {
      'vendor_approved': 'preparing'
    };
    
    const finalStatus = statusMap[clientStatus] || clientStatus;
    
    if (!validStatuses.includes(finalStatus)) {
      console.error(`Invalid status: ${clientStatus} (mapped to ${finalStatus})`);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status "${clientStatus}". Valid options: ${validStatuses.join(', ')}`,
        validStatuses,
        receivedStatus: clientStatus
      });
    }
    
    // 3. Find order
    const order = await Order.findById(orderId)
      .populate('user', 'name email phoneNumber')
      .populate('items.menuItem', 'name price image');
    if (!order) {
      console.warn(`Order not found: ${orderId}`);
      return res.status(404).json({ 
        success: false, 
        message: `Order ${orderId.slice(-8)} not found or already deleted.` 
      });
    }

    // 4. Update
    const oldStatus = order.orderStatus;
    order.orderStatus = finalStatus;
    await order.save();
    
    console.log(`Status updated: ${orderId.slice(-8)} ${oldStatus} → ${finalStatus}`);

    // 5. Notify customer (fire & forget)
    sendOrderStatusUpdate(order, finalStatus).catch(err => console.error('Email failed:', err));

    res.json({ 
      success: true, 
      message: `Status updated to "${finalStatus.replace('_', ' ')}"`,
      data: order 
    });
  } catch (error) {
    console.error('Status update ERROR:', error);
    res.status(400).json({ 
      success: false, 
      message: `Status update failed: ${error.message}`,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

// ===== GET SINGLE USER ORDER (Tracking) =====
exports.getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const order = await Order.findOne({ _id: id, user: req.user._id })

      .populate('items.menuItem', 'name price image')
      .lean();
      
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or access denied' });
    }

    // Clean data
    const cleanOrder = {
      ...order,
      totalAmount: Number(order.totalAmount) || 0,
      items: (order.items || []).map(item => ({
        ...item,
        price: Number(item.price) || 0
      }))
    };

    console.log(`User order lookup: ${id.slice(-8)} for ${req.user.email}`);
    res.json({ success: true, data: cleanOrder });
  } catch (error) {
    console.error('getMyOrderById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== DOWNLOAD USER TRANSACTIONS (NO ADMIN REQUIRED) =====
exports.downloadMyTransactions = async (req, res) => {
    try {
      const { format = 'csv' } = req.query;
      const validFormats = ['pdf', 'docx', 'csv'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ success: false, message: `Invalid format. Use: ${validFormats.join(', ')}` });
      }

      // Explicitly allow non-admin users - download own transactions only
      if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      console.log(`User download ${format}: ID=${req.user._id} (${req.user.email || 'no-email'}, role=${req.user.role || 'none'}) -> NO ADMIN REQUIRED`);

      // Reuse getMyOrders logic
      // Enhanced log already added above
      
      let orders;
      try {
        orders = await Order.find({ user: new mongoose.Types.ObjectId(req.user._id) })
          .populate('items.menuItem', 'name image')
          .sort({ createdAt: -1 })
          .lean();  // REMOVED LIMIT - ALL orders
      } catch (populateErr) {
        console.error('Populate failed:', populateErr);
        orders = [];
      }
      
      console.log(`Found ${orders.length} orders for export`);


      if (!orders.length) {
        return res.status(404).json({ success: false, message: 'No transactions found' });
      }

      // Defensive data cleaning like getMyOrders
      const safeOrders = (orders || []).map(order => ({
        ...order,
        totalAmount: Number(order.totalAmount) || 0,
        items: (order.items || []).map(item => ({
          ...item,
          price: Number(item.price) || 0,
          menuItem: item.menuItem || null
        }))
      }));
      const exportData = formatOrdersData(safeOrders, 'user');
      let filename = `my-transactions-${new Date().toISOString().slice(0,10)}.${format}`;

      console.log(`Generating ${format.toUpperCase()} for ${safeOrders.length} orders...`);
      
      res.set({
        'Content-Type': format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      let tempFile;
      try {
        switch (format) {
          case 'pdf':
            tempFile = await generatePDF(exportData, filename);
            break;
          case 'docx':
            tempFile = await generateDOCX(exportData, filename);
            break;
          case 'csv':
            tempFile = generateCSV(exportData, filename);
            break;
        }
        res.download(tempFile, filename, (err) => {
          if (!err) {
            try { fs.unlinkSync(tempFile); } catch(unlinkErr) { console.warn('Cleanup failed:', unlinkErr.message); }
          } else {
            console.error('Download error:', err);
          }
        });
      } catch (genErr) {
        console.error(`Generate ${format} failed:`, genErr);
        res.status(500).json({ success: false, message: `Failed to generate ${format.toUpperCase()}: ${genErr.message}` });
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ success: false, message: 'Download failed' });
    }
  };

  // ===== DOWNLOAD ADMIN TRANSACTIONS =====
  exports.downloadAdminTransactions = async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin only' });
      }

      const { format = 'csv', status, dateFrom, limit = 100 } = req.query;
      const validFormats = ['pdf', 'docx', 'csv'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ success: false, message: `Invalid format. Use: ${validFormats.join(', ')}` });
      }

      const query = {};
      if (status) query.orderStatus = status;
      if (dateFrom) query.createdAt = { $gte: new Date(dateFrom) };

      const orders = await Order.find(query)
        .populate('user', 'name phoneNumber')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      if (!orders.length) {
        return res.status(404).json({ success: false, message: 'No transactions found' });
      }

      const exportData = formatOrdersData(orders, 'admin');
      let filename = `admin-transactions-${new Date().toISOString().slice(0,10)}.${format}`;

      res.set({
        'Content-Type': format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      switch (format) {
        case 'pdf':
          const pdfFile = await generatePDF(exportData, filename);
          res.download(pdfFile, filename, (err) => {
            if (!err) fs.unlinkSync(pdfFile);
          });
          break;
        case 'docx':
          const docxFile = await generateDOCX(exportData, filename);
          res.download(docxFile, filename, (err) => {
            if (!err) fs.unlinkSync(docxFile);
          });
          break;
        case 'csv':
          const csvFile = generateCSV(exportData, filename);
          res.download(csvFile, filename, (err) => {
            if (!err) fs.unlinkSync(csvFile);
          });
          break;
      }
    } catch (error) {
      console.error('Admin download error:', error);
      res.status(500).json({ success: false, message: 'Download failed' });
    }
  };



