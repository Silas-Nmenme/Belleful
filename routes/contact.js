const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

/**
 * Contact Routes
 */

// Public: Submit contact form
router.post('/', contactController.submitContactForm);

// Admin protected routes
router.use(auth);
router.use(isAdmin);

router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
