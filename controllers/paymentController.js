const multer = require('multer');
const { cloudinary, uploadImage } = require('../config/cloudinary');
const Order = require('../models/Order');
const { verifyPaymentMock } = require('../services/paymentService');

const auth = require('../middleware/auth');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

exports.uploadReceipt = [auth, upload.single('receipt'), async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid order' });
    }

    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment already processed' });
    }

    const result = await uploadImage('receipts').upload(req.file.path);
    order.receiptImage = result.secure_url;
    order.paymentReference = `belleful_${Date.now()}`; // Mock ref

    await order.save();

    res.json({ success: true, message: 'Receipt uploaded. Waiting for verification.', reference: order.paymentReference });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}];

exports.webhook = (req, res, next) => {
  express.raw({type: 'application/json'})(req, res, next);
  verifyPaymentMock(req, res);
};

