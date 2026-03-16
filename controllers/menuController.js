const MenuItem = require('../models/MenuItem');
const { deleteImage, uploadImage } = require('../config/cloudinary');


/**
 * Menu Controller - Admin CRUD with validation & inventory
 */


// ===== GET ALL ITEMS =====
exports.getMenu = async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 12 } = req.query;
    
    const query = { available: true, stock: { $gt: 0 } };
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
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ===== MATCH MODEL VALIDATION =====
const isValidationError = (error) => error.name === 'ValidationError';


// ===== CREATE ITEM (Admin) =====
/**
 * Create new menu item with validation & inventory setup
 */
exports.createMenuItem = async (req, res) => {
  try {
    let itemData = {
      ...req.body,
      stock: req.body.stock ?? 50,
      available: (req.body.stock ?? 50) > 0
    };
    
    if (req.file) {
      try {
        const result = await uploadImage('menu');
        itemData.image = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        itemData.image = '/asset/placeholder-food.jpg'; // Use placeholder
      }
    } else {
      itemData.image = '/asset/placeholder-food.jpg'; // Default no image
    }
    
    const item = await MenuItem.create(itemData);
    
    const populated = await MenuItem.findById(item._id); // For virtuals
    
    res.status(201).json({ 
      success: true, 
      data: populated,
      message: 'Menu item created successfully'
    });
  } catch (error) {
    if (isValidationError(error)) {
      const msg = Object.values(error.errors)[0].message;
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Server error creating menu item' });
  }
};



// ===== UPDATE ITEM (Admin) =====
/**
 * Update menu item with validation & image handling
 */
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Handle image change first
    let imageDeleted = false;
    if (req.body.image && req.body.image !== item.image && item.image) {
      try {
        const publicIdMatch = item.image.match(/\/([^/]+)\.(jpg|jpeg|png|webp)$/i);
        if (publicIdMatch) {
          await deleteImage(publicIdMatch[1]);
          imageDeleted = true;
        }
      } catch (imgErr) {
        console.warn('Image deletion failed:', imgErr.message);
      }
    }

    // Update with model validation
    const updateData = {
      ...req.body,
      available: (req.body.stock ?? item.stock) > 0
    };
    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      data: updated,
      message: 'Menu item updated successfully'
    });
  } catch (error) {
    if (isValidationError(error)) {
      const msg = Object.values(error.errors)[0].message;
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Server error updating menu item' });
  }
};



// ===== DELETE ITEM (Admin) =====
/**
 * Delete menu item & cleanup image
 */
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.image) {
      const publicIdMatch = item.image.match(/\/([^/]+)\.(jpg|jpeg|png|webp)$/i);
      if (publicIdMatch) {
        await deleteImage(publicIdMatch[1]);
      }
    }

    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Menu item deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting menu item' });
  }
};




