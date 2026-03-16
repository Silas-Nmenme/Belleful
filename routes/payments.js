const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const { getUploadUrl } = require('../config/cloudinary');

/**
 * Payments Routes - Receipt upload & webhook
 */
router.post('/webhook', paymentController.paymentWebhook); // Public for webhooks

// Public upload url
router.get('/receipt-upload-url', (req, res) => {
  const { folder = 'receipts' } = req.query;
  res.json(getUploadUrl(folder));
});

router.use(auth);
router.post('/receipt', paymentController.uploadReceipt);

module.exports = router;


