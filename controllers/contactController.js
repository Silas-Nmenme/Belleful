const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactAdminNotification, sendContactReply } = require('../services/emailService');

/**
 * Contact Form Controller - Saves to DB + Email notification + Admin listing
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

      await sendContactAdminNotification({
        name,
        email,
        phone,
        message,
        timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
      });

      await sendContactReply(email, name);

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

// Get all contacts for admin (paginated, sorted newest first, status filter)
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // unread, read, ready

    const query = {};
    if (status && ['unread', 'read', 'ready'].includes(status)) {
      query.status = status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-replies') // Don't populate full replies for table
        .lean(),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single contact by ID
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update contact status
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['unread', 'read', 'ready'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ 
      success: true, 
      data: contact,
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reply to contact
const replyToContact = async (req, res) => {
  try {
    const { replyText } = req.body;
    if (!replyText || replyText.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Reply must be at least 10 characters' });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    // Add reply
    const newReply = {
      replyText: replyText.trim(),
      repliedBy: req.user?.name || 'Admin', // From auth middleware
      emailSent: false
    };

    contact.replies.push(newReply);
    await contact.save();

    // Send email reply
    const emailResult = await sendContactReply(contact.email, contact.name, replyText.trim());
    if (emailResult.success) {
      newReply.emailSent = true;
      await contact.save();
    } else {
      console.error('Reply email failed:', emailResult);
    }

    // Mark as ready
    contact.status = 'ready';
    await contact.save();

    res.json({ 
      success: true, 
      data: contact,
      message: emailResult.success ? 'Reply sent successfully!' : 'Reply saved (email failed)'
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { 
  contactUs, 
  getAllContacts, 
  getContactById,
  updateContactStatus,
  replyToContact
};

