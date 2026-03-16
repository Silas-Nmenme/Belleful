const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

/**
 * Payments Routes - Receipt upload & webhook
 */
router.post('/webhook', paymentController.paymentWebhook); // Public for webhooks
router.use(auth);
router.post('/receipt', paymentController.upload.single('receipt'), paymentController.uploadReceipt);

module.exports = router;


