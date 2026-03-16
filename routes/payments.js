const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

/**
 * Payments Routes - Receipt upload
 */
router.use(auth);
router.post('/receipt', paymentController.uploadReceipt);
router.post('/webhook', paymentController.paymentWebhook); // Public for webhooks

module.exports = router;

