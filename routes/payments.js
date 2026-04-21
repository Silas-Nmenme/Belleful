const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const { getUploadUrl } = require('../config/cloudinary');

/**
 * Payments Routes - Receipt upload & verification
 */

// Public webhook (no auth)
router.post('/webhook', paymentController.paymentWebhook);

// Public upload url
router.get('/receipt-upload-url', (req, res) => {
  const { folder = 'order-receipts' } = req.query;
  try {
    const uploadData = getUploadUrl(folder);
    res.json(uploadData);
  } catch (error) {
    console.error('Upload URL generation failed:', error);
    res.status(500).json({ error: 'Upload configuration error' });
  }
});

// Auth required routes
router.use(auth);

// User uploads receipt
router.post('/receipt', paymentController.uploadReceipt);

// User checks receipt status
router.get('/receipt-status/:orderId', paymentController.getReceiptStatus);

// Admin verifies receipt
router.post('/verify-receipt', isAdmin, paymentController.adminVerifyReceipt);

module.exports = router;


