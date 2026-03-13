const nodemailer = require('nodemailer');
const { emailTemplates } = require('../utils/emailTemplates');

// Validate email config on module load
if (!process.env.MAIL_USER || !process.env.EMAIL_PASS || !process.env.EMAIL_HOST) {
  console.error('🚨 Email config failed: Missing vars in .env');
  console.error('Required: MAIL_USER, EMAIL_PASS, EMAIL_HOST');
  console.error('Current:', {
    MAIL_USER: process.env.MAIL_USER ? `${process.env.MAIL_USER.split('@')[0]}@...` : 'MISSING',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✅ SET' : 'MISSING',
    EMAIL_HOST: process.env.EMAIL_HOST || 'MISSING'
  });
} else {
  console.log('📧 Email config loaded successfully');
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Validate email config on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('🚨 Email config failed:', error.message);
  } else {
    console.log('✅ Email server ready');
  }
});

// Send OTP verification email
const sendOTPEmail = async (email, name, otp) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Your Belleful Verification Code',
    html: emailTemplates.otpVerification(name, otp)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent to: ${email}`);
    return { success: true, message: 'OTP email sent successfully' };
  } catch (err) {
    console.error(`❌ OTP Email failed to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Send template email (generic)
const sendTemplateEmail = async (email, subject, html, text = '') => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Template email sent to: ${email}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Template email failed to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  return sendTemplateEmail(
    email,
    'Welcome to Belleful!',
    emailTemplates.welcome(name)
  );
};

// Send order confirmation to customer
const sendOrderConfirmationEmail = async (order) => {
  // Assuming order has populated user field
  const userEmail = order.user.email;
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: `Order #${order._id} Confirmed - Belleful`,
    html: emailTemplates.orderConfirmation(order)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation sent to: ${userEmail}`);
    return { success: true, message: 'Order confirmation sent successfully' };
  } catch (err) {
    console.error(`❌ Order confirmation failed to ${userEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Send order status update to customer
const sendOrderStatusUpdateEmail = async (order, newStatus) => {
  const userEmail = order.user.email;
  const statusConfig = {
    'pending_approval': { emoji: '⏳', color: '#FFA500' },
    'vendor_approved': { emoji: '✅', color: '#28a745' },
    'preparing': { emoji: '🔥', color: '#DC3545' },
    'ready': { emoji: '🍽️', color: '#007BFF' },
    'off_for_delivery': { emoji: '🚀', color: '#6F42C1' },
    'delivered': { emoji: '🎉', color: '#28A745' }
  };
  const config = statusConfig[newStatus] || { emoji: '📦', color: '#6C757D' };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Status Update - Belleful</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${config.color}22 0%, ${config.color}44 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .status-badge { background: ${config.color}; color: white; padding: 10px 20px; border-radius: 25px; font-size: 18px; font-weight: bold; display: inline-block; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .progress { text-align: center; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.emoji} Order Update #${order._id.slice(-6)}</h1>
    <div class="status-badge">${newStatus.replace('_', ' ').toUpperCase()}</div>
  </div>
  <div class="content">
    <p>Hi ${order.user.name},</p>
    <p>Your order status has been updated to <strong>${newStatus.replace('_', ' ')}</strong>.</p>
    <div class="progress">
      <p>Order Total: ₦${order.totalAmount}</p>
      <p>Track your order in the Belleful dashboard.</p>
    </div>
  </div>
  <div class="footer">
    <p>© 2026 Belleful. All rights reserved.</p>
  </div>
</body>
</html>`;

  return sendTemplateEmail(
    userEmail,
    `Order #${order._id.slice(-6)} - ${newStatus.replace('_', ' ')}`,
    html
  );
};

// Send email to admin on new order
const sendNewOrderEmail = async (order) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order #${order._id} - Belleful`,
    html: `
      <h1>New Order Received</h1>
      <p><strong>Customer:</strong> ${order.user.name}</p>
      <p><strong>Total:</strong> ₦${order.totalAmount}</p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `<li>${item.name} x${item.quantity} @₦${item.price}</li>`).join('')}
      </ul>
      <p>View in dashboard.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ New order email sent to admin for order #${order._id}`);
    return { success: true, message: 'New order notification sent successfully' };
  } catch (err) {
    console.error(`❌ New order email failed for #${order._id}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { 
  sendOTPEmail, 
  sendWelcomeEmail, 
  sendTemplateEmail,
  sendOrderConfirmationEmail,
  sendNewOrderEmail,
  sendOrderStatusUpdateEmail
};

