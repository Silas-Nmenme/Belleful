const Order = require('../models/Order');
const { uploadImage } = require('../config/cloudinary');
const multer = require('multer');

/**
 * Payment Controller - Receipt Upload & Verification
 * Manual payment proof → Admin verifies
 */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/receipts/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});

// ===== UPLOAD RECEIPT =====
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const result = await uploadImage('receipts', {
      resource_type: 'auto',
      public_id: `receipt-${req.user._id}-${Date.now()}`
    });

    // Update latest pending order
    const order = await Order.findOne({ 
      user: req.user._id, 
      paymentStatus: 'pending' 
    }).sort({ createdAt: -1 });

    if (order) {
      order.paymentStatus = 'verified';
      order.receiptImage = result.secure_url;
      order.paymentReference = `rcpt-${result.public_id}`;
      await order.save();
    }

    // Cleanup temp file
    require('fs').unlink(req.file.path, () => {});

    res.json({ 
      success: true, 
      receiptUrl: result.secure_url,
      orderId: order?._id 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== WEBHOOK MOCK (Stripe/Flutterwave) =====
exports.paymentWebhook = (req, res) => {
  // Verify signature (prod)
  // Update order paymentStatus = 'paid'
  console.log('Payment webhook:', req.body);
  res.json({ success: true, message: 'Webhook received' });
};

module.exports = { uploadReceipt: upload.single('receipt'), paymentWebhook };

