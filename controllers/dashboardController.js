const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// ===== ADMIN DASHBOARD =====

// @desc Get admin dashboard stats
// Total orders, revenue, users, menu items, recent orders
exports.getAdminStats = [auth, isAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      Order.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      User.countDocuments(),
      MenuItem.countDocuments({ available: true }),
      Order.find()
        .populate('user', 'name email')
        .populate('items.menuItem', 'name')
        .sort('-createdAt')
        .limit(10)
        .lean()
    ]);

    const [orderStats, totalUsers, activeMenuItems, recentOrders] = stats;
    
    res.json({
      success: true,
      data: {
        totalOrders: orderStats[0]?.total || 0,
        totalRevenue: orderStats[0]?.revenue || 0,
        totalUsers,
        activeMenuItems,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get users list (paginated, searchable)
exports.getUsers = [auth, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const filter = search 
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get admin orders (filtered)
exports.getAdminOrders = [auth, isAdmin, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (status) filter.orderStatus = status;
    if (dateFrom) filter.createdAt = { $gte: new Date(dateFrom) };
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.menuItem', 'name price')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// ===== USER DASHBOARD - FULL PROJECT MATCH =====

const Cart = require('../models/Cart');

// @desc Get user dashboard stats (enhanced)
exports.getUserStats = [auth, async (req, res) => {
  try {
    const stats = await Promise.all([
      Order.aggregate([
        { $match: { user: req.user.id } },
        { $group: { _id: null, total: { $sum: 1 }, spent: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ user: req.user.id, orderStatus: 'delivered' })
    ]);

    const [userOrders, completedOrders] = stats;
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.menuItem');

    res.json({
      success: true,
      data: {
        totalOrders: userOrders[0]?.total || 0,
        totalSpent: userOrders[0]?.spent || 0,
        completedOrders,
        cartItems: cart?.items.length || 0,
        cartTotal: cart?.totalAmount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get paginated user orders
exports.getUserOrders = [auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let filter = { user: req.user.id };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name image price')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get user profile
exports.getUserProfile = [auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get user cart summary
exports.getUserCart = [auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.menuItem', 'name image price')
      .lean();
    res.json({ success: true, data: cart || { items: [], totalAmount: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc Get user payment history
exports.getUserPayments = [auth, async (req, res) => {
  try {
    const payments = await Order.find({ user: req.user.id, paymentStatus: { $ne: 'pending' } })
      .select('paymentReference paymentStatus totalAmount createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean();
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];


