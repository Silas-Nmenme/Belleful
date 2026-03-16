const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

/**
 * Dashboard Controller - Analytics & Stats
 */

// ===== USER DASHBOARD =====
exports.getUserStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          avgOrder: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({ 
      success: true, 
      stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrder: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ADMIN STATS =====
exports.getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          activeUsers: { $addToSet: '$user' }
        }
      },
      { $addFields: { totalUsers: { $size: '$activeUsers' } } }
    ]);

    // Today's orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
      orderStatus: { $ne: 'cancelled' }
    });

    const totalUsers = await User.countDocuments({});
    const activeMenuItems = await MenuItem.countDocuments({available: true});

    res.json({ 
      success: true,
      stats: {
        ...(stats[0] || {}),
        totalUsers,
        activeMenuItems,
        todayOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== TOP ITEMS =====
exports.getTopItems = async (req, res) => {
  try {
    const topItems = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json({ success: true, data: topItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

