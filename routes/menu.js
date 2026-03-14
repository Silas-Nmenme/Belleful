const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const upload = require('../middleware/multerConfig');

// GET /api/menu - public menu listing
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Admin CRUD
router.post('/', upload.single('image'), auth, isAdmin, createMenuItem);
router.put('/:id', [auth, isAdmin], updateMenuItem);
router.delete('/:id', [auth, isAdmin], deleteMenuItem);

module.exports = router;

