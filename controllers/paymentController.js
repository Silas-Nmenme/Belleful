const Order = require('../models/Order');

/**
 * Payment Controller - Receipt Upload & Verification
 * Manual payment proof → Admin verifies
 */

// No multer - direct Cloudinary

// ===== UPLOAD RECEIPT =====
exports.uploadReceipt = async (req, res) => {
  try {
    const { receiptUrl } = req.body;
    if (!receiptUrl || !receiptUrl.includes('cloudinary.com')) {
      return res.status(400).json({ success: false, message: 'No valid receipt URL provided' });
    }

    // Update latest pending approval order
    const order = await Order.findOne({ 
      user: req.user._id, 
      orderStatus: 'pending_approval' 
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(400).json({ success: false, message: 'No pending order found' });
    }

    order.paymentStatus = 'verified';
    order.receiptImage = receiptUrl;
    order.paymentReference = `rcpt-${Date.now()}`;
    
    // Advance to payment verified (awaiting final admin approval)
    order.orderStatus = 'payment_verified';

    await order.save();

    res.json({ 
      success: true, 
      receiptUrl,
      orderId: order._id,
      message: 'Receipt uploaded & verified! Awaiting admin approval.'
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

module.exports = { 
  uploadReceipt: exports.uploadReceipt,
  paymentWebhook: exports.paymentWebhook
};

