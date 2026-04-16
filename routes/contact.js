const express = require('express');
const { contactUs, getAllContacts, getContactById, updateContactStatus, replyToContact } = require('../controllers/contactController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

const router = express.Router();

router.post('/contact', contactUs);

// Protected admin routes
router.use(auth);
router.use(isAdmin);
router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.patch('/:id/status', updateContactStatus);
router.post('/:id/reply', replyToContact);

module.exports = router;


