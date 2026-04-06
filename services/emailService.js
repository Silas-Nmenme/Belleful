const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

/**
 * Email Service - Production OTP, Orders, Notifications
 * Inline templates, config validation, async error handling
 */
let transporter;

/**
 * Initialize transporter with validation
 */
const initTransporter = () => {
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'MAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length) {
    console.warn('Email service disabled - missing ENV:', missing);
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });

  // Verify on init
  transporter.verify(err => {
    if (err) console.error('Email transporter failed:', err.message);
    else console.log('Email service ready');
  });

  return transporter;
};

// Init on load
initTransporter();

/**
 * Send OTP Email
 */
const sendOTPEmail = async (email, name, otp) => {
  if (!transporter) return { success: false, message: 'Email service unavailable' };

  const html = emailTemplates.otpVerification(name, otp);

  const mailOptions = {
    from: `"Belleful" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Your Belleful Verification Code',
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error(`OTP email failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name, htmlTemplate) => {
  if (!transporter) return { success: false };
  return sendTemplateEmail(email, `Welcome to Belleful, ${name}!`, htmlTemplate);
};

/**
 * Generic Template Email
 */
const sendTemplateEmail = async (email, subject, html, htmlTemplate) => {
  if (!transporter) return { success: false };

  const mailOptions = {
    from: `"Belleful" <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    html: htmlTemplate || html
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error(`Template email failed: ${error.message}`);
    return { success: false };
  }
};

/**
 * Order Confirmation
 */
const sendOrderConfirmation = async (order) => {
  const html = emailTemplates.orderConfirmation(order);

  return sendTemplateEmail(
    order.user.email,
    `Order Confirmed - #${order._id.slice(-6)}`,
    html
  );
};

/**
 * Order Status Update
 */
const sendOrderStatusUpdate = async (order, status) => {
  const html = emailTemplates.orderStatusUpdate(order, status);

  return sendTemplateEmail(
    order.user.email,
    `Order Update #${order._id.slice(-6)}`,
    html
  );
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendTemplateEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate
};

