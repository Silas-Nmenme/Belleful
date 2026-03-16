const MenuItem = require('../models/MenuItem');
const { deleteImage } = require('../config/cloudinary');
const { isAdmin } = require('../middleware/role');

/**
 * Menu Controller - CRUD with Inventory
 */

// ===== GET ALL ITEMS =====
exports.getMenu = async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 12 } = req.query;
    
    const query = { available: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const items = await MenuItem.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET SINGLE =====
exports.getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CREATE ITEM (Admin) =====
exports.createMenuItem = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (imageUrl && !imageUrl.includes('cloudinary.com')) {
      return res.status(400).json({ success: false, message: 'Invalid image URL' });
    }

    const item = await MenuItem.create({
      ...req.body,
      image: imageUrl || ''
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== UPDATE ITEM (Admin) =====
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const { imageUrl } = req.body;
    if (imageUrl && !imageUrl.includes('cloudinary.com')) {
      return res.status(400).json({ success: false, message: 'Invalid image URL' });
    }

    // Delete old image if new URL provided
    if (imageUrl && imageUrl !== item.image && item.image) {
      const publicId = item.image.split('/').pop().split('.')[0];
      await deleteImage(publicId);
    }

    Object.assign(item, req.body);
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== DELETE ITEM (Admin) =====
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (item.image) {
      const publicId = item.image.split('/').pop().split('.')[0];
      await deleteImage(publicId);
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

