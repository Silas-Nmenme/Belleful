const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');
const { emailTemplates } = require('../utils/emailTemplates');

/**
 * Contact Form Controller - Saves to DB + Email notification
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

    try {
      // Save to DB first
      const contact = new Contact({ name, email, phone, message });
      await contact.save();

      // Send admin email
      const timestamp = new Date().toLocaleString();
      const emailContent = emailTemplates.contactForm(name, email, phone, message.replace(/\n/g, '<br>'), timestamp);
      const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.MAIL_USER;
      const emailResult = await emailService.sendTemplateEmail(
        adminEmail,
        'New Contact Form: ' + name,
        emailContent
      );

      // Auto-reply to user
      const replyContent = `
        <h2>Thank you for contacting Belleful! </h2>
        <p>Hi ` + name + `,</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>Best regards,<br>The Belleful Team</p>
      `;
      await emailService.sendTemplateEmail(email, 'We Received Your Message - Belleful', replyContent);

      res.json({ 
        success: true, 
        message: 'Message saved and sent successfully! We will reply soon.',
        contactId: contact._id
      });
    } catch (error) {
      console.error('Contact save/email error:', error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }
];

module.exports = { contactUs };

