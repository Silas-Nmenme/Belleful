const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.MAIL_USER || 'support@belleful.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CONTACT_ADMIN_EMAIL || process.env.MAIL_USER || 'support@belleful.com';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const buildInfoLine = (label, value) => `<p style="margin: 0 0 6px 0;"><strong>${label}</strong> ${value || '<span style="color:#6c757d;">Not provided</span>'}</p>`;

const statusLabels = {
  pending_payment: 'Pending Payment',
  pending_approval: 'Pending Approval',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const colorByStatus = (status) => {
  const palette = {
    pending_payment: '#ffc107',
    pending_approval: '#17a2b8',
    preparing: '#fd7e14',
    ready_for_pickup: '#0dcaf0',
    out_for_delivery: '#0d6efd',
    delivered: '#198754',
    cancelled: '#dc3545'
  };
  return palette[status] || '#6c757d';
};

const renderItemsTable = (items = []) => items.map(item => `
  <tr>
    <td style="padding: 12px 10px; border-bottom: 1px solid #e9ecef;">${item.name}</td>
    <td style="padding: 12px 10px; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
    <td style="padding: 12px 10px; border-bottom: 1px solid #e9ecef; text-align: right;">${formatCurrency(item.price)}</td>
    <td style="padding: 12px 10px; border-bottom: 1px solid #e9ecef; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
  </tr>`).join('');

const renderOrderDetailsSection = (order) => {
  const deliveryTypeLabel = order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup';
  const deliveryInfo = order.deliveryMethod === 'delivery'
    ? buildInfoLine('Delivery Address:', order.deliveryAddress)
    : buildInfoLine('Pickup Location:', order.pickupLocation || 'Belleful Restaurant - Main Branch');

  const paymentInfo = buildInfoLine(
    'Payment Status:',
    order.paymentStatus ? statusLabels[order.paymentStatus] || order.paymentStatus.replace(/_/g, ' ').toUpperCase() : 'Pending'
  );

  const paymentReferenceInfo = order.paymentReference
    ? buildInfoLine('Payment Reference:', order.paymentReference)
    : '';

  const manualBankInfo = order.bankName && order.bankAccount
    ? `<div style="margin-top: 8px;">
        <p style="margin: 0 0 6px 0;"><strong>Payment Method:</strong> Bank Transfer</p>
        <p style="margin: 0 0 6px 0;"><strong>Bank:</strong> ${order.bankName}</p>
        <p style="margin: 0 0 6px 0;"><strong>Account:</strong> ${order.bankAccount}</p>
      </div>`
    : '';

  return `
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 18px; color: #343a40; margin-bottom: 12px;">Order & Delivery Details</h3>
      ${buildInfoLine('Order Number:', order.displayId || '#'+order._id.toString().slice(-6))}
      ${buildInfoLine('Order Date:', formatDate(order.createdAt))}
      ${buildInfoLine('Order Status:', statusLabels[order.orderStatus] || order.orderStatus.replace(/_/g, ' ').toUpperCase())}
      ${buildInfoLine('Fulfillment:', deliveryTypeLabel)}
      ${deliveryInfo}
      ${buildInfoLine('Customer Phone:', order.phoneNumber)}
      ${paymentInfo}
      ${paymentReferenceInfo}
      ${manualBankInfo}
      ${order.notes ? `<p style="margin: 10px 0 0 0; color: #495057;"><strong>Order Notes:</strong> ${order.notes}</p>` : ''}
    </div>`;
};

const renderBaseTemplate = ({ title, intro, body, ctaLabel, ctaUrl, helpText, preheaderText }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .email-wrapper { width: 100%; background-color: #f4f6f9; padding: 24px 0; }
    .email-content { max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 50px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #198754 0%, #0d6efd 100%); color: #ffffff; padding: 32px 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; line-height: 1.1; }
    .header p { margin: 12px auto 0; max-width: 520px; color: rgba(255,255,255,.92); font-size: 16px; }
    .content { padding: 32px; color: #343a40; }
    .intro { font-size: 17px; margin-bottom: 22px; line-height: 1.75; }
    .card { border: 1px solid #e9ecef; border-radius: 16px; padding: 22px; margin-bottom: 26px; background: #f8f9fa; }
    .section-title { margin: 0 0 18px 0; font-size: 18px; color: #212529; }
    .button { display: inline-block; padding: 14px 28px; border-radius: 999px; background: #0d6efd; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; }
    .footer { padding: 24px 32px 32px; font-size: 14px; color: #6c757d; text-align: center; }
    .footer a { color: #0d6efd; text-decoration: none; }
    @media (max-width: 620px) { .email-content { border-radius: 0; } .header { padding: 24px 18px 18px; } .content { padding: 24px 18px; } }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <div class="header">
        <h1>${title}</h1>
        <p>${intro}</p>
      </div>
      <div class="content">
        ${body}
        ${ctaLabel && ctaUrl ? `<div style="text-align:center; margin: 28px 0;"><a href="${ctaUrl}" class="button">${ctaLabel}</a></div>` : ''}
        ${helpText ? `<div class="card"><p style="margin:0; line-height:1.75;">${helpText}</p></div>` : ''}
      </div>
      <div class="footer">
        <p>Need help? Reach out at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <p>© 2026 Belleful. Trusted food delivery and pickup.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const emailTemplates = {
  otpVerification: (name, otp) => {
    const body = `
      <div class="card">
        <h2 class="section-title">Verify your email</h2>
        <p style="margin-bottom: 18px;">Hi ${name}, thank you for registering with Belleful. Use the code below to confirm your email address.</p>
        <div style="background: linear-gradient(135deg, #0d6efd, #6610f2); color: white; font-size: 34px; letter-spacing: 10px; text-align: center; padding: 22px 0; border-radius: 16px; margin: 18px 0;">${otp}</div>
        <p style="margin:0; color:#6c757d;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
      </div>`;

    return renderBaseTemplate({
      title: 'Verify Your Belleful Account',
      intro: 'Secure your account with a one-time verification code.',
      body,
      helpText: 'If you did not request this code, please ignore this email.'
    });
  },

  welcome: (name) => {
    const body = `
      <div class="card">
        <h2 class="section-title">Welcome to Belleful, ${name}!</h2>
        <p>We are delighted to have you on board. Your account is now ready and you can explore menus, customize orders, and enjoy fast delivery or pickup.</p>
        <ul style="padding-left: 18px; margin: 18px 0 0 0; color: #495057;">
          <li>Discover fresh dishes from our menu</li>
          <li>Save favorites and build your perfect meal</li>
          <li>Track your order from kitchen to doorstep</li>
        </ul>
      </div>`;

    return renderBaseTemplate({
      title: 'Welcome to Belleful!',
      intro: 'Your account is active and ready for delicious moments.',
      body,
      ctaLabel: 'Start Ordering',
      ctaUrl: FRONTEND_URL
    });
  },

  orderConfirmation: (order) => {
    const itemRows = renderItemsTable(order.items || []);
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const body = `
      <div class="card">
        <h2 class="section-title">Thank you for your order!</h2>
        <p>We have received your request and our team is now processing it. Below is a complete summary of your order.</p>
        <p style="margin: 14px 0 0 0; color: #495057;"><strong>${totalItems}</strong> item${totalItems === 1 ? '' : 's'} in your order, totaling <strong>${formatCurrency(order.totalAmount)}</strong>.</p>
      </div>
      ${renderOrderDetailsSection(order)}
      <div style="margin-bottom: 22px; overflow-x:auto;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef; text-align:left;">
              <th style="padding: 12px 10px;">Item</th>
              <th style="padding: 12px 10px; text-align:center;">Qty</th>
              <th style="padding: 12px 10px; text-align:right;">Unit Price</th>
              <th style="padding: 12px 10px; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
      <div class="card" style="background:#ffffff; border:none;">
        <p style="margin: 0 0 8px 0;"><strong>Order total:</strong> ${formatCurrency(order.totalAmount)}</p>
        <p style="margin: 0; color: #6c757d; font-size: 15px;">View the latest status in your Belleful dashboard anytime.</p>
      </div>`;

    return renderBaseTemplate({
      title: 'Order Confirmed',
      intro: `Your order ${order.displayId || '#'+order._id.toString().slice(-6)} has been successfully placed.`,
      body,
      ctaLabel: 'View My Orders',
      ctaUrl: `${FRONTEND_URL}/dashboard`,
      helpText: 'Questions? Reply to this email or contact our support team for assistance.'
    });
  },

  orderAdminNotification: (order) => {
    const itemRows = renderItemsTable(order.items || []);
    const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const body = `
      <div class="card">
        <h2 class="section-title">New order placed</h2>
        <p>A new customer order has been received. Please review the order details and update the order status in the admin dashboard.</p>
      </div>
      <div class="card" style="background:#ffffff; border:none;">
        <p style="margin: 0 0 6px 0;"><strong>Customer Name:</strong> ${order.user?.name || 'Unknown'}</p>
        <p style="margin: 0 0 6px 0;"><strong>Customer Email:</strong> ${order.user?.email || 'Unknown'}</p>
        <p style="margin: 0 0 6px 0;"><strong>Phone:</strong> ${order.phoneNumber || 'Not provided'}</p>
        <p style="margin: 0 0 6px 0;"><strong>Order Number:</strong> ${order.displayId || '#'+order._id.toString().slice(-6)}</p>
        <p style="margin: 0 0 6px 0;"><strong>Placed:</strong> ${formatDate(order.createdAt)}</p>
        <p style="margin: 0 0 6px 0;"><strong>Order Value:</strong> ${formatCurrency(order.totalAmount)}</p>
        <p style="margin: 0; color: #6c757d; font-size: 15px;">${totalItems} item${totalItems === 1 ? '' : 's'} in this order.</p>
      </div>
      ${renderOrderDetailsSection(order)}
      <div style="margin-bottom: 22px; overflow-x:auto;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef; text-align:left;">
              <th style="padding: 12px 10px;">Item</th>
              <th style="padding: 12px 10px; text-align:center;">Qty</th>
              <th style="padding: 12px 10px; text-align:right;">Unit Price</th>
              <th style="padding: 12px 10px; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
      <div class="card" style="background:#ffffff; border:none;">
        <p style="margin: 0; color: #6c757d; font-size: 15px;">Open the admin dashboard to approve, prepare, or dispatch this order.</p>
      </div>`;

    return renderBaseTemplate({
      title: 'New Order Notification',
      intro: `New order received for ${formatCurrency(order.totalAmount)}.`,
      body,
      ctaLabel: 'Open Admin Dashboard',
      ctaUrl: `${FRONTEND_URL}/admin/orders`,
      helpText: 'Keep orders moving quickly by approving and processing this request promptly.'
    });
  },

  orderStatusUpdate: (order, status) => {
    const itemRows = renderItemsTable(order.items || []);
    const statusName = statusLabels[status] || status.replace(/_/g, ' ').toUpperCase();
    const messageMap = {
      preparing: 'Your order is now being prepared by our kitchen team.',
      ready_for_pickup: 'Your order is ready for collection at the restaurant.',
      out_for_delivery: 'Your delivery is on the way and will arrive shortly.',
      delivered: 'Your order has been delivered. Enjoy your meal!',
      cancelled: 'This order has been cancelled. Contact support if you need help.',
      pending_payment: 'Your order is awaiting payment confirmation.',
      pending_approval: 'Your order is being reviewed and will be approved shortly.'
    };
    const statusMessage = messageMap[status] || 'Your order status has changed. Please review the details below.';

    const body = `
      <div class="card">
        <h2 class="section-title">Order Status Updated</h2>
        <p>${statusMessage}</p>
      </div>
      ${renderOrderDetailsSection(order)}
      <div style="margin-bottom: 22px; overflow-x:auto;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef; text-align:left;">
              <th style="padding: 12px 10px;">Item</th>
              <th style="padding: 12px 10px; text-align:center;">Qty</th>
              <th style="padding: 12px 10px; text-align:right;">Unit Price</th>
              <th style="padding: 12px 10px; text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>
      <div class="card" style="background:#ffffff; border:none;">
        <p style="margin: 0 0 8px 0;"><strong>Order total:</strong> ${formatCurrency(order.totalAmount)}</p>
        <p style="margin: 0; color: #6c757d; font-size: 15px;">Visit your dashboard for continued tracking and estimated pickup/delivery times.</p>
      </div>`;

    return renderBaseTemplate({
      title: `Order ${statusName}`,
      intro: `Update for ${order.displayId || '#'+order._id.toString().slice(-6)}.`,
      body,
      ctaLabel: 'Track Your Order',
      ctaUrl: `${FRONTEND_URL}/dashboard`,
      helpText: 'If you need additional support, reply to this email or contact our customer team.'
    });
  },

  passwordReset: (name, resetUrl) => {
    const body = `
      <div class="card">
        <h2 class="section-title">Password reset requested</h2>
        <p>Hi ${name}, click the button below to reset your password. This link will expire in one hour.</p>
        <p style="margin: 0; text-align:center;"><a href="${resetUrl}" class="button">Reset Password</a></p>
      </div>`;

    return renderBaseTemplate({
      title: 'Reset Your Belleful Password',
      intro: 'Use the link below to update your account password securely.',
      body,
      helpText: 'If you did not request a password reset, please ignore this message or contact support.'
    });
  },

  contactForm: (name, email, phone, message, timestamp) => {
    const body = `
      <div class="card">
        <h2 class="section-title">New contact submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Submitted:</strong> ${timestamp}</p>
      </div>
      <div class="card" style="background: #ffffff; border:none;">
        <h3 style="margin:0 0 10px 0; font-size: 16px; color: #343a40;">Message</h3>
        <p style="white-space: pre-wrap; color:#495057; line-height:1.75; margin:0;">${message}</p>
      </div>`;

    return renderBaseTemplate({
      title: 'New Contact Form Submission',
      intro: 'A customer message has been received through the Belleful contact form.',
      body,
      helpText: 'Please respond promptly to maintain great customer service.'
    });
  },

  contactReply: (name) => {
    const body = `
      <div class="card">
        <h2 class="section-title">Thanks for reaching out!</h2>
        <p>Hi ${name},</p>
        <p>We’ve received your message and our support team is reviewing it now. We’ll get back to you within 24 hours.</p>
        <p>If you need urgent assistance, feel free to reply to this email or contact us directly at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </div>`;

    return renderBaseTemplate({
      title: 'Message Received - Belleful',
      intro: 'Thank you for contacting Belleful. We’re on it.',
      body,
      helpText: 'We appreciate your patience. A member of our team will respond shortly.'
    });
  },

  loginSuccess: (name, timestamp) => {
    const body = `
      <div class="card">
        <h2 class="section-title">Login Successful</h2>
        <p>Hi ${name}, you have successfully signed in to your Belleful account.</p>
        <p style="margin: 0 0 6px 0;"><strong>Logged in at:</strong> ${timestamp}</p>
        <p>If you did not initiate this login, please secure your account immediately.</p>
      </div>`;

    return renderBaseTemplate({
      title: 'Login Successful',
      intro: 'Welcome back to Belleful. Your session is now active.',
      body,
      ctaLabel: 'Continue Shopping',
      ctaUrl: FRONTEND_URL,
      helpText: 'If this wasn’t you, reset your password or contact support right away.'
    });
  }
};

module.exports = emailTemplates;
