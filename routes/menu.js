const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
// Direct Cloudinary uploads
const { getUploadUrl } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Menu Routes - Public browse, Admin CRUD
 */

// Public
router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItem);

// Upload URL endpoint (admin protected + auth headers)
router.get('/upload-url', auth, (req, res) => {
  const { folder = 'menu' } = req.query;
  try {
    res.json(getUploadUrl(folder));
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'Cloudinary config missing' });
  }
});

// Admin protected
router.use(auth);
router.use(isAdmin);

router.post('/', upload.single('image'), menuController.createMenuItem);
router.put('/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;

