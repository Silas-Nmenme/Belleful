// utils/emailTemplates.js - Professional Bootstrap Food Ordering Templates

const emailTemplates = {
  // 1. OTP Verification (Already good, enhanced)
  otpVerification: (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Belleful Account</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); }
    .main-container { max-width: 500px; margin: 40px auto; }
    .hero { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 20px 20px 0 0; text-align: center; }
    .otp-card { background: white; padding: 40px; border-radius: 0 0 20px 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .otp-display { background: linear-gradient(135deg, #007bff, #0056b3); color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 25px; border-radius: 15px; margin: 30px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="hero">
      <i class="fas fa-utensils fa-3x mb-3 d-block"></i>
      <h1>Welcome to <strong>Belleful</strong>! 🍽️</h1>
    </div>
    <div class="otp-card">
      <h3 class="text-center mb-4">Verify Your Email</h3>
      <div class="otp-display">${otp}</div>
      <p class="text-center text-muted mb-4">Your verification code is valid for 10 minutes.</p>
      <div class="text-center">
        <small class="text-muted">Don't share this code with anyone.</small>
      </div>
      <hr class="my-4">
      <div class="text-center">
        <p class="mb-0"><i class="fas fa-heart text-danger"></i> © 2024 Belleful - Delicious Food Delivered</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  // 2. Welcome Email
  welcome: (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Belleful!</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .hero { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 50px 30px; }
    .btn-order { background: linear-gradient(135deg, #ff6b6b, #ee5a52); border: none; padding: 15px 40px; font-size: 18px; border-radius: 50px; font-weight: 600; }
    .features { background: white; margin: 30px 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container-fluid p-0">
    <div class="hero text-center">
      <i class="fas fa-utensils fa-4x mb-4 d-block"></i>
      <h1 class="display-4 fw-bold mb-3">Welcome ${name}!</h1>
      <p class="lead mb-4">Your Belleful account is ready. Time to explore delicious meals!</p>
    </div>
    
    <div class="container py-5">
      <div class="features mx-auto" style="max-width: 600px;">
        <div class="row g-0">
          <div class="col-md-4 text-center p-4 border-end">
            <i class="fas fa-search fa-2x text-warning mb-3"></i>
            <h5>Browse Menu</h5>
            <p class="small text-muted">Discover amazing dishes</p>
          </div>
          <div class="col-md-4 text-center p-4 border-end">
            <i class="fas fa-shopping-cart fa-2x text-primary mb-3"></i>
            <h5>Add to Cart</h5>
            <p class="small text-muted">Quick & easy checkout</p>
          </div>
          <div class="col-md-4 text-center p-4">
            <i class="fas fa-truck fa-2x text-success mb-3"></i>
            <h5>Fast Delivery</h5>
            <p class="small text-muted">Hot food at your door</p>
          </div>
        </div>
      </div>

      <div class="text-center mt-5">
        <a href="${process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app'}" class="btn btn-order btn-lg text-white text-decoration-none">
          <i class="fas fa-spa fa-xs me-2"></i>
          Start Ordering Now!
        </a>
      </div>
    </div>

    <div class="text-center py-4 bg-light">
      <small class="text-muted">
        <i class="fas fa-heart text-danger me-1"></i>
        Made with ❤️ for food lovers | © 2024 Belleful
      </small>
    </div>
  </div>
</body>
</html>
  `,

  // 3. Order Confirmation
  orderConfirmation: (order) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed - #${order._id.slice(-6)}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', sans-serif; }
    .hero { background: linear-gradient(135deg, #28a745, #20c997); color: white; }
    .order-card { border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .item-row { border-bottom: 1px solid #eee; padding: 15px 0; }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="hero text-center py-5 rounded-top">
      <i class="fas fa-check-circle fa-4x mb-4 d-block"></i>
      <h1 class="display-5 fw-bold">Order Confirmed!</h1>
      <h3 class="mb-0">#${order._id.slice(-6).toUpperCase()}</h3>
    </div>

    <div class="order-card mx-auto mt-n4 p-4" style="max-width: 600px;">
      <div class="row">
        <div class="col-md-6">
          <h5><i class="fas fa-${order.deliveryMethod === 'pickup' ? 'store-alt' : 'map-marker-alt'} text-success me-2"></i>${order.deliveryMethod === 'pickup' ? 'Pickup Info' : 'Delivery Info'}</h5>
          <p class="mb-1"><strong>${order.user?.name || 'Customer'}</strong></p>
          ${order.deliveryMethod === 'pickup' ? `<p class="mb-1"><strong>Pickup:</strong> ${order.pickupLocation}</p>` : `<p class="mb-1">${order.deliveryAddress}</p>`}
          <p class="mb-0">${order.phoneNumber}</p>
        </div>
        <div class="col-md-6 text-end">
          <h4 class="text-success mb-1">₦${order.totalAmount.toLocaleString()}</h4>
          <p class="text-muted mb-0">${order.items.length} items</p>
        </div>
      </div>

      <hr>

      <h5>Your Order</h5>
      ${order.items.map(item => `
        <div class="item-row d-flex align-items-center">
          <div class="flex-grow-1">
            <strong>${item.name}</strong>
            <br><small class="text-muted">₦${item.price.toLocaleString()} × ${item.quantity}</small>
          </div>
          <div class="text-end">
            <strong>₦${(item.price * item.quantity).toLocaleString()}</strong>
          </div>
        </div>
      `).join('')}

      <div class="border-top pt-3 mt-3">
        <div class="d-flex justify-content-between">
          <span>Total Amount:</span>
          <strong class="text-success fs-4">₦${order.totalAmount.toLocaleString()}</strong>
        </div>
      </div>

      <div class="text-center mt-4">
        <p class="text-muted mb-3">Track your order in Dashboard</p>
        <a href="${process.env.FRONTEND_URL || 'https://bellefulchop.netlify.app'}/dashboard" class="btn btn-success btn-lg">
          <i class="fas fa-tachometer-alt me-2"></i>View Orders
        </a>
      </div>
    </div>

    <div class="text-center mt-5">
      <small class="text-muted">
        <i class="fas fa-utensils me-2"></i>© 2024 Belleful - ${order.deliveryMethod === 'pickup' ? 'Ready for Pickup' : 'Fast Delivery'}
      </small>
    </div>
  </div>
</body>
</html>
  `,

  // 4. Order Status Update
  orderStatusUpdate: (order, status) => {
    const statusConfig = {
      preparing: { icon: 'fa-fire', color: 'warning', title: 'Cooking in Progress' },
      ready_for_pickup: { icon: 'fa-utensils', color: 'info', title: 'Ready for Pickup' },
      out_for_delivery: { icon: 'fa-shipping-fast', color: 'primary', title: 'Out for Delivery' },
      delivered: { icon: 'fa-check-circle', color: 'success', title: 'Delivered!' }
    };
    
    const config = statusConfig[status] || statusConfig.preparing;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Update - #${order._id.slice(-6)}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', sans-serif; }
    .hero { background: linear-gradient(135deg, ${config.color === 'success' ? '#28a745' : config.color === 'warning' ? '#ffc107' : config.color === 'info' ? '#17a2b8' : '#007bff'}, #20c997); color: white; }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="hero text-center py-5 rounded">
      <i class="fas ${config.icon} fa-5x mb-4 d-block"></i>
      <h1 class="display-5 fw-bold">${config.title}</h1>
      <h3 class="mb-0">#${order._id.slice(-6).toUpperCase()}</h3>
    </div>
    
    <div class="card mx-auto mt-n4 shadow-lg" style="max-width: 500px; border-radius: 20px;">
      <div class="card-body p-5 text-center">
        <p class="lead mb-4">Your order is now <strong>${status.replace('_', ' ').toUpperCase()}</strong></p>
        <div class="row g-3 mb-4">
          ${order.items.slice(0,3).map(item => `
            <div class="col-12">
              <small class="text-muted">${item.name} × ${item.quantity}</small>
            </div>
          `).join('')}
        </div>
        <a href="${process.env.FRONTEND_URL}/dashboard" class="btn btn-primary btn-lg px-5">
          <i class="fas fa-tachometer-alt me-2"></i>Track Order
        </a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  },

  // 5. Password Reset (from authController)
  passwordReset: (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Password - Belleful</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background: linear-gradient(135deg, #ff6b6b, #feca57); }
    .hero { background: linear-gradient(135deg, #dc3545, #c82333); color: white; }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="hero text-center py-5 rounded-top">
      <i class="fas fa-key fa-4x mb-4 d-block"></i>
      <h1 class="display-5">Reset Your Password</h1>
    </div>
    <div class="card mx-auto mt-n4 p-5 shadow" style="max-width: 500px; border-radius: 0 0 20px 20px;">
      <p class="text-center mb-4">Hi <strong>${name}</strong>,</p>
      <p class="text-center text-muted mb-4">Click below to reset your Belleful password. This link expires in 1 hour.</p>
      <div class="text-center">
        <a href="${resetUrl}" class="btn btn-danger btn-lg px-5 mb-3" style="border-radius: 50px;">
          <i class="fas fa-lock-open me-2"></i>Reset Password
        </a>
      </div>
      <div class="text-center">
        <small class="text-muted">Didn't request this? Ignore this email.</small>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  // 6. Contact Form Reply (existing)
  contactForm: (name, email, phone, message, timestamp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form - Belleful</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f8f9fa; }
    .card { border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="card mx-auto" style="max-width: 600px;">
      <div class="card-header bg-gradient text-white text-center py-4" style="background: linear-gradient(135deg, #28a745, #20c997)!important;">
        <i class="fas fa-envelope fa-3x mb-3"></i>
        <h2>New Contact Submission</h2>
      </div>
      <div class="card-body p-5">
        <div class="row mb-4">
          <div class="col-md-6">
            <strong><i class="fas fa-user me-2"></i>Name:</strong><br>${name}
          </div>
          <div class="col-md-6">
            <strong><i class="fas fa-envelope me-2"></i>Email:</strong><br>${email}
          </div>
        </div>
        <div class="mb-4">
          <strong><i class="fas fa-phone me-2"></i>Phone:</strong><br>${phone}
        </div>
        <div class="mb-4">
          <strong><i class="fas fa-comment me-2"></i>Message:</strong>
          <div class="bg-light p-4 rounded mt-2" style="white-space: pre-wrap; min-height: 100px; border-left: 4px solid #28a745;">
            ${message}
          </div>
        </div>
        <div class="text-muted text-end small">
          Submitted: ${timestamp}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
};

module.exports = { emailTemplates };

