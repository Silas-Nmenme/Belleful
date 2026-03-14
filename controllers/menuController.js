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
    console.log('Menu create - body:', req.body);
    console.log('Menu create - file:', req.file ? req.file.filename : 'no file');

    // Validate required fields
    const { name, category, price } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!category || !['food', 'drink', 'side'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Category must be food, drink, or side' });
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a number greater than 0' });
    }

    let imageUrl = '';
    if (req.file) {
      const result = await uploadImage('menu').upload(req.file.path);
      imageUrl = result.secure_url;
      // Cleanup temp file
      require('fs').unlink(req.file.path, (err) => {
        if (err) console.error('Temp file cleanup error:', err);
      });
    }

    const itemData = {
      name: name.trim(),
      category,
      price: priceNum,
      description: req.body.description?.trim() || '',
      available: req.body.available !== 'false',
      image: imageUrl
    };

    const item = new MenuItem(itemData);
    const createdItem = await item.save();
    
    res.status(201).json({ success: true, data: createdItem });
  } catch (error) {
    console.error('Create menu error:', error);
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

