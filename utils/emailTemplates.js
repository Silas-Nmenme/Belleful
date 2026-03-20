// utils/emailTemplates.js - Professional, responsive email templates for Belleful
// All templates: mobile-friendly, branded gradients (#667eea → #764ba2), emojis, consistent footer

const emailTemplates = {
  /**
   * OTP Verification Template
   * @param {string} name - User name
   * @param {string} otp - 6-digit code
   */
  otpVerification: (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Your Belleful Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px; font-size: 28px; }
    .otp-box { background: rgba(255,255,255,0.2); font-size: 36px; font-weight: 700; letter-spacing: 8px; color: white; padding: 20px; margin: 20px 0; border-radius: 12px; backdrop-filter: blur(10px); }
    .content { padding: 40px 30px; text-align: center; }
    .content p { color: #666; margin: 0 0 20px; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
    .btn { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; }
    @media (max-width: 600px) { .otp-box { font-size: 28px; letter-spacing: 4px; } .header { padding: 30px 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍽️ Belleful Verification</h1>
      <p>Hi <strong>${name}</strong>,</p>
    </div>
    <div class="content">
      <p>Your verification code is:</p>
      <div class="otp-box">${otp}</div>
      <p style="font-size: 14px; color: #999;">Valid for 10 minutes. Never share your code.</p>
    </div>
    <div class="footer">
      <p>© 2024 Belleful. Made with ❤️ for food lovers.</p>
    </div>
  </div>
</body>
</html>`,

  /**
   * Welcome Email Template
   * @param {string} name - User name
   */
  welcomeEmail: (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Welcome to Belleful!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .hero { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 60px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
    .feature { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; }
    .btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
    @media (max-width: 600px) { .hero { padding: 40px 20px; } .features { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to Belleful, ${name}!</h1>
    </div>
    <div class="hero">
      <h2>Your account is ready!</h2>
      <p>Discover delicious meals, quick checkout, and amazing service.</p>
    </div>
    <div class="content">
      <div class="features">
        <div class="feature">
          <h3>🍕 Fresh Menu</h3>
          <p>Updated daily with your favorites</p>
        </div>
        <div class="feature">
          <h3>⚡ Fast Delivery</h3>
          <p>Ready in under 30 minutes</p>
        </div>
        <div class="feature">
          <h3>💳 Easy Payment</h3>
          <p>Multiple secure options</p>
        </div>
      </div>
      <a href="${process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app'}" class="btn">Start Ordering Now</a>
    </div>
    <div class="footer">
      <p>© 2024 Belleful. Crafted with passion for food lovers everywhere.</p>
    </div>
  </div>
</body>
</html>`,

  /**
   * Password Reset Template
   * @param {string} name - User name
   * @param {string} resetUrl - Full reset URL
   */
  passwordReset: (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Reset Your Belleful Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; text-align: center; }
    .btn { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin: 20px 0; font-size: 16px; }
    .expire { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; color: #856404; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
      <p>Hi <strong>${name}</strong>,</p>
    </div>
    <div class="content">
      <p>You requested a password reset. Click below to set a new password:</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <div class="expire">
        <strong>This link expires in 10 minutes.</strong><br>
        If you didn't request this, safely ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>© 2024 Belleful. Your security is our priority.</p>
    </div>
  </div>
</body>
</html>`,

  /**
   * Contact Form Notification (Admin)
   * @param {Object} contact - {fullName, email, phoneNumber, message}
   */
  contactNotification: (contact) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>New Contact Form - Belleful</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #fdcb6e, #e17055); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .info-item { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #fdcb6e; }
    .message { background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; white-space: pre-line; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Contact Form</h1>
      <p>New message received</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-item">
          <strong>Name:</strong><br>${contact.fullName}
        </div>
        <div class="info-item">
          <strong>Email:</strong><br><a href="mailto:${contact.email}">${contact.email}</a>
        </div>
        <div class="info-item">
          <strong>Phone:</strong><br>${contact.phoneNumber}
        </div>
      </div>
      <div class="message">
        <strong>Message:</strong><br>${contact.message.replace(/\n/g, '<br>')}
      </div>
    </div>
    <div class="footer">
      <p>Submitted: ${new Date().toLocaleString()}<br>© 2024 Belleful</p>
    </div>
  </div>
</body>
</html>`,

  /**
   * Order Confirmation Template
   * @param {Object} order - {id, items:[], totalAmount, deliveryAddress, phoneNumber}
   */
  orderConfirmation: (order) => {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px 0;">${item.name}</td>
        <td style="padding: 12px 0; text-align: center;">x${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right;">₦${item.price * item.quantity}</td>
      </tr>`).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Order Confirmed #${order._id.slice(-6)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 40px 30px; text-align: center; }
    .order-id { background: #28a745; color: white; padding: 10px 20px; border-radius: 20px; font-weight: 600; }
    .content { padding: 40px 30px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { padding: 15px 0; text-align: left; }
    .total { font-size: 24px; font-weight: 700; color: #28a745; text-align: right; margin: 20px 0; }
    .address { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed!</h1>
      <div class="order-id">#${order._id.slice(-6)}</div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total">Total: ₦${order.totalAmount}</div>
      ${order.deliveryAddress ? `
      <div class="address">
        <strong>📍 Delivery:</strong><br>${order.deliveryAddress}<br>
        📞 ${order.phoneNumber || 'TBD'}
      </div>` : ''}
      <p>Track your order in Dashboard → Orders</p>
    </div>
    <div class="footer">
      <p>Thank you for choosing Belleful! 🍽️<br>© 2024</p>
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Order Status Update Template
   * @param {string} orderId - Short ID
   * @param {string} status - e.g. 'preparing', 'delivered'
   */
  orderStatusUpdate: (orderId, status) => {
    const statusConfig = {
      'preparing': { emoji: '🔥', title: 'Cooking in Progress' },
      'ready_for_pickup': { emoji: '🍽️', title: 'Ready for Pickup' },
      'out_for_delivery': { emoji: '🚀', title: 'Out for Delivery' },
      'delivered': { emoji: '✅', title: 'Delivered!' },
      'cancelled': { emoji: '❌', title: 'Cancelled' }
    };
    const config = statusConfig[status] || { emoji: '📦', title: status.replace('_', ' ').toUpperCase() };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Order Update #${orderId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .status-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 50px 30px; text-align: center; }
    .status-emoji { font-size: 64px; margin-bottom: 10px; }
    .content { padding: 40px 30px; text-align: center; }
    .order-id { background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 20px; font-weight: 600; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status-header">
      <div class="status-emoji">${config.emoji}</div>
      <h2>${config.title}</h2>
    </div>
    <div class="content">
      <p>Your order <strong>#${orderId}</strong> is now ${status.replace('_', ' ')}.</p>
      <div class="order-id">#${orderId}</div>
    </div>
    <div class="footer">
      <p>Belleful • Bringing food to you<br>© 2024</p>
    </div>
  </div>
</body>
</html>`;
  }
};

module.exports = { emailTemplates };

