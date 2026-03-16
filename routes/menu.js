const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/**
 * Menu Routes - Public browse, Admin CRUD
 */

// Public
router.get('/', menuController.getMenu);
router.get('/:id', menuController.getMenuItem);

// Admin protected
router.use(auth);
router.use(isAdmin);

router.post('/', upload.single('image'), menuController.createMenuItem);
router.put('/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

module.exports = router;

