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

// Upload URL endpoint (public)
router.get('/upload-url', (req, res) => {
  const { folder = 'menu' } = req.query;
  res.json(getUploadUrl(folder));
});

// Admin protected
router.use(auth);
router.use(isAdmin);

router.post('/', upload.single('image'), menuController.createMenuItem);
router.put('/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;

