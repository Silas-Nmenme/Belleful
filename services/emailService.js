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

  await transporter.sendMail(mailOptions);
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'Welcome to Belleful!',
    html: emailTemplates.welcome(name)
  };

  await transporter.sendMail(mailOptions);
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

  await transporter.sendMail(mailOptions);
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

  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendOTPEmail, 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail,
  sendNewOrderEmail 
};
