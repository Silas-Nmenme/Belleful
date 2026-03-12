const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email to admin on new order
const sendNewOrderEmail = async (order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
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

module.exports = { sendNewOrderEmail };

