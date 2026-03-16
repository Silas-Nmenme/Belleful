const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
// Direct Cloudinary uploads
const { getUploadUrl } = require('../config/cloudinary');

/**
 * Menu Routes - Public browse, Admin CRUD
 */

// Public
router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItem);

// Upload URL endpoint (public)
router.get('/upload-url', (req, res) => {
  const { folder = 'menu' } = req.query;
  res.json(getUploadUrl(folder));
});

// Admin protected
router.use(auth);
router.use(isAdmin);

router.post('/', menuController.createMenuItem);
router.put('/:id', menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;

