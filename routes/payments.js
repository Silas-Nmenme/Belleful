const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/upload-receipt', auth, paymentController.uploadReceipt);
router.post('/webhook', paymentController.webhook);

module.exports = router;


