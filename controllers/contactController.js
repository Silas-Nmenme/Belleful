const { body, validationResult } = require('express-validator');
const emailService = require('../services/emailService');
const { emailTemplates } = require('../utils/emailTemplates');

/**
 * Contact Form Controller
 * Handles contact us submissions via email notification
 */
const contactUs = [
  // Validation middleware
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').trim().notEmpty().withMessage('Phone number required').isMobilePhone('any').withMessage('Valid phone required'),
  body('message').trim().notEmpty().withMessage('Message required').isLength({ max: 1000 }).withMessage('Message too long'),

  // Handler
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => err.msg)
      });
    }

    const { name, email, phone, message } = req.body;

    // Use fancy template from emailTemplates
    const timestamp = new Date().toLocaleString();
    const emailContent = emailTemplates.contactForm(name, email, phone, message.replace(/\n/g, '<br>'), timestamp);

    // Use existing email service (to business/admin email or fallback)
    const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.MAIL_USER;
    const result = await emailService.sendTemplateEmail(
      adminEmail,
      'New Contact Form: ' + name,
      emailContent
    );

    if (result.success) {
      // Optional: Auto-reply to user
      const replyContent = `
        <h2>Thank you for contacting Belleful!</h2>
        <p>Hi ` + name + `,</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>Best regards,<br>The Belleful Team</p>
      `;
      await emailService.sendTemplateEmail(email, 'We Received Your Message - Belleful', replyContent);

      res.json({ success: true, message: "Message sent successfully! We'll reply soon." });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
  }
];

module.exports = { contactUs };

