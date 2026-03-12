const emailTemplates = {

  otpVerification: (name, otp) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Verify Your Belleful Account</title>

<style>
body {
  font-family: Arial, sans-serif;
  line-height:1.6;
  color:#333;
  max-width:600px;
  margin:0 auto;
  padding:20px;
}

.header{
  background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  color:white;
  padding:30px;
  text-align:center;
  border-radius:10px 10px 0 0;
}

.content{
  background:#f9f9f9;
  padding:30px;
  border-radius:0 0 10px 10px;
}

.otp-box{
  background:white;
  font-size:32px;
  font-weight:bold;
  letter-spacing:10px;
  color:#667eea;
  padding:20px;
  text-align:center;
  border:2px solid #eee;
  border-radius:10px;
  margin:20px 0;
}

.footer{
  text-align:center;
  padding:20px;
  color:#666;
  font-size:14px;
}
</style>

</head>

<body>

<div class="header">
<h1>Welcome to Belleful 🍽️</h1>
<p>Hi ${name},</p>
</div>

<div class="content">

<h2>Verify your email address</h2>

<p>Your verification code is:</p>

<div class="otp-box">${otp}</div>

<p>This code will expire in 10 minutes.</p>

<p>If you didn't request this, please ignore this email.</p>

</div>

<div class="footer">
<p>© 2026 Belleful. All rights reserved.</p>
</div>

</body>
</html>
`,



  welcome: (name) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Welcome to Belleful</title>

<style>
body{
  font-family: Arial, sans-serif;
  line-height:1.6;
  color:#333;
  max-width:600px;
  margin:0 auto;
  padding:20px;
}

.header{
  background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
  color:white;
  padding:30px;
  text-align:center;
  border-radius:10px 10px 0 0;
}

.content{
  background:#f9f9f9;
  padding:30px;
  border-radius:0 0 10px 10px;
}

.features{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  gap:20px;
  margin:20px 0;
}

.feature{
  background:white;
  padding:20px;
  border-radius:10px;
  text-align:center;
  box-shadow:0 2px 10px rgba(0,0,0,0.1);
}

.footer{
  text-align:center;
  padding:20px;
  color:#666;
  font-size:14px;
}
</style>

</head>

<body>

<div class="header">
<h1>Welcome to Belleful, ${name}! 🎉</h1>
</div>

<div class="content">

<h2>Your account is ready!</h2>

<p>Thanks for verifying your email. Start exploring delicious meals:</p>

<div class="features">

<div class="feature">
<h3>🍲 Fresh Menu</h3>
<p>Daily updated menu</p>
</div>

<div class="feature">
<h3>🚚 Fast Delivery</h3>
<p>Quick service guaranteed</p>
</div>

<div class="feature">
<h3>💳 Secure Payments</h3>
<p>Safe checkout</p>
</div>

</div>

<p>Happy eating!</p>

</div>

<div class="footer">
<p>© 2026 Belleful. All rights reserved.</p>
</div>

</body>
</html>
`,



  orderConfirmation: (order) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Order Confirmed - Belleful</title>

<style>
body{
  font-family: Arial, sans-serif;
  line-height:1.6;
  color:#333;
  max-width:600px;
  margin:0 auto;
  padding:20px;
}

.header{
  background:linear-gradient(135deg,#4CAF50 0%,#45a049 100%);
  color:white;
  padding:30px;
  text-align:center;
  border-radius:10px 10px 0 0;
}

.content{
  background:#f9f9f9;
  padding:30px;
}

.order-details{
  background:white;
  padding:20px;
  border-radius:10px;
  margin:20px 0;
}

.item{
  display:flex;
  justify-content:space-between;
  padding:10px 0;
  border-bottom:1px solid #eee;
}

.total{
  font-size:24px;
  font-weight:bold;
  color:#4CAF50;
  text-align:right;
}

.footer{
  text-align:center;
  padding:20px;
  color:#666;
  font-size:14px;
  border-top:1px solid #eee;
}
</style>

</head>

<body>

<div class="header">
<h1>Order Confirmed ✅</h1>
<p>Order #${order._id}</p>
</div>

<div class="content">

<div class="order-details">

<h3>Thank you for your order!</h3>

<p>We'll prepare your delicious meal right away.</p>

${order.items.map(item => `
<div class="item">
<span>${item.name} x${item.quantity}</span>
<span>₦${item.price * item.quantity}</span>
</div>
`).join('')}

<div class="total">
Total: ₦${order.totalAmount}
</div>

<p><strong>Payment:</strong> ${order.paymentStatus}</p>

</div>

<p>Track your order in the app.</p>

</div>

<div class="footer">
<p>© 2026 Belleful. All rights reserved.</p>
</div>

</body>
</html>
`

};

module.exports = { emailTemplates };