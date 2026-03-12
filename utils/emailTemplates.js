// utils/emailTemplates.js

const emailTemplates = {
  // OTP verification email
  otpVerification: (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Belleful Account</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #667eea; padding: 20px; text-align: center; border: 2px solid #eee; border-radius: 10px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Belleful! 🍽️</h1>
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

  // Google welcome template
  googleWelcomeTemplate: (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Belleful - Google Signup!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .google-badge { background: #4285f4; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Belleful, ${name}! 🎉</h1>
    <div class="google-badge">Signed up with Google</div>
  </div>
  <div class="content">
    <h2>Your Google account is connected!</h2>
    <p>Thanks for joining with Google. Start exploring delicious meals right away!</p>
    <p>No verification needed - you\'re all set!</p>
  </div>
  <div class="footer">
    <p>© 2026 Belleful. All rights reserved.</p>
  </div>
</body>
</html>
  `,

  // Welcome email after verification
  welcome: (name) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Belleful - Google Signup!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .google-badge { background: #4285f4; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Belleful, ${name}! 🎉</h1>
    <div class="google-badge">Signed up with Google</div>
  </div>
  <div class="content">
    <h2>Your Google account is connected!</h2>
    <p>Thanks for joining with Google. Start exploring delicious meals right away!</p>
    <p>No verification needed - you\'re all set!</p>
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
  <title>Welcome to Belleful!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Belleful, ${name}! 🎉</h1>
  </div>
  <div class="content">
    <h2>Your account is ready!</h2>
    <p>Thanks for verifying your email. Start exploring delicious meals!</p>
  </div>
  <div class="footer">
    <p>© 2026 Belleful. All rights reserved.</p>
  </div>
</body>
</html>
  `
};

module.exports = { emailTemplates };