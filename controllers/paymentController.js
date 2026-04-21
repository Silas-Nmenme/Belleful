const Order = require('../models/Order');
const { sendOrderStatusUpdate } = require('../services/emailService');

/**
 * Payment Controller - Receipt Upload & Verification
 * Manual payment proof → Admin verifies receipt image
 * NOTE: This is for receipt uploads, not real-time payment gateway integration
 */

// Helper: Validate Cloudinary URL
const isValidCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('cloudinary.com') && 
           (url.includes('upload') || url.includes('image'));
  } catch {
    return false;
  }
};

// ===== UPLOAD RECEIPT =====
exports.uploadReceipt = async (req, res) => {
  try {
    const { receiptUrl, orderId } = req.body;
    
    // Input validation
    if (!receiptUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt image URL is required' 
      });
    }

    if (!isValidCloudinaryUrl(receiptUrl)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid receipt URL. Must be a valid image URL from Cloudinary.' 
      });
    }

    // Find order (by ID if provided, otherwise latest pending)
    let order;
    if (orderId) {
      order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
        orderStatus: 'pending_approval'
      });
    } else {
      order = await Order.findOne({ 
        user: req.user._id, 
        orderStatus: 'pending_approval' 
      }).sort({ createdAt: -1 });
    }

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pending order found for this payment receipt' 
      });
    }

    // Validate receipt image is not too small (at least 20KB)
    const urlWithTrackingPixel = `${receiptUrl}?timestamp=${Date.now()}`;
    
    order.paymentStatus = 'pending'; // Changed from 'verified' - admin must verify
    order.receiptImage = receiptUrl;
    order.paymentReference = `rcpt-${order._id}-${Date.now()}`;
    
    // Keep order status as pending_approval until admin reviews receipt
    // Order stays in pending_approval until admin confirms payment in receipt

    await order.save();

    // Notify admin of new receipt
    const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_ADMIN_EMAIL || 'admin@belleful.com';
    sendOrderStatusUpdate(order, 'pending_approval').catch(err => 
      console.error('Payment receipt notification failed:', err)
    );

    res.json({ 
      success: true, 
      receiptUrl,
      orderId: order._id,
      paymentReference: order.paymentReference,
      message: 'Receipt uploaded successfully! Admin will verify within 30 minutes.',
      note: 'Your order status will be updated to "Preparing" once admin confirms payment.'
    });

  } catch (error) {
    console.error('Receipt upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload receipt' 
    });
  }
};

// ===== GET RECEIPT STATUS =====
exports.getReceiptStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    }).select('paymentStatus paymentReference receiptImage orderStatus createdAt');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        receiptImage: order.receiptImage,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        isVerified: order.paymentStatus === 'verified' || order.orderStatus !== 'pending_approval'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ===== ADMIN: VERIFY RECEIPT =====
exports.adminVerifyReceipt = async (req, res) => {
  try {
    const { orderId, verified, notes } = req.body;

    if (!orderId || typeof verified !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'orderId and verified status required' 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (verified) {
      order.paymentStatus = 'verified';
      order.orderStatus = 'preparing'; // Move to kitchen
    } else {
      order.paymentStatus = 'failed';
      order.orderStatus = 'pending_payment'; // Back to payment step
      order.receiptImage = null; // Clear failed receipt
    }

    order.notes = notes || order.notes;
    await order.save();

    // Notify customer
    sendOrderStatusUpdate(order, order.orderStatus).catch(err => 
      console.error('Order status update email failed:', err)
    );

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        message: verified ? 'Receipt verified, order sent to kitchen' : 'Receipt rejected, awaiting resubmission'
      }
    });
  } catch (error) {
    console.error('Admin verify receipt error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ===== WEBHOOK MOCK (Future Stripe/Flutterwave) =====
exports.paymentWebhook = (req, res) => {
  // TODO: Integrate with real payment gateway
  // Verify signature (prod)
  // Update order paymentStatus = 'paid'
  console.log('Payment webhook received:', {
    timestamp: new Date().toISOString(),
    body: req.body
  });
  res.json({ success: true, message: 'Webhook received' });
};

module.exports = { 
  uploadReceipt: exports.uploadReceipt,
  getReceiptStatus: exports.getReceiptStatus,
  adminVerifyReceipt: exports.adminVerifyReceipt,
  paymentWebhook: exports.paymentWebhook
};

