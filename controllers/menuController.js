const MenuItem = require('../models/MenuItem');
const { cloudinary, uploadImage } = require('../config/cloudinary');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

// @desc  Get all menu items
exports.getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true }).sort('-createdAt');
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single menu item
exports.getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create menu item (admin)
exports.createMenuItem = [auth, isAdmin, async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const result = await uploadImage('menu').upload(req.file.path);
      imageUrl = result.secure_url;
    }

    const item = new MenuItem({
      ...req.body,
      image: imageUrl
    });

    const createdItem = await item.save();
    res.status(201).json({ success: true, data: createdItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc  Update menu item (admin)
exports.updateMenuItem = [auth, isAdmin, async (req, res) => {
  try {
    let item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

// @desc  Delete menu item (admin)
exports.deleteMenuItem = [auth, isAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

