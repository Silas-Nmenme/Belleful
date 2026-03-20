const Contact = require('../models/Contact');
const { sendTemplateEmail } = require('../services/emailService');

/**
 * Contact Controller - Handle contact form submissions
 */
 
// ===== SUBMIT CONTACT FORM =====
exports.submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, message } = req.body; 
    // Basic validation
    if (!fullName || !email || !phoneNumber || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }   
    const newContact = await Contact.create({ fullName, email, phoneNumber, message });
    
    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">🔔 New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
          <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Submitted: ${new Date().toLocaleString()}</p>
        </div>`;
      await sendTemplateEmail(adminEmail, 'New Contact Form Submission - Belleful', html);
    } else {
      console.log('ADMIN_EMAIL not set. Contact saved but no email sent:', { fullName, email, phoneNumber });
    }

    res.status(201).json({ success: true, message: 'Contact form submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET ALL CONTACTS (Admin) =====
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== GET SINGLE CONTACT (Admin) =====
exports.getContactById = async (req, res) => {
  try {
    const contactEntry = await Contact.findById(req.params.id);
    if (!contactEntry) return res.status(404).json({ success: false, message: 'Contact entry not found' });
    res.json({ success: true, data: contactEntry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== DELETE CONTACT (Admin) =====   
exports.deleteContact = async (req, res) => {
  try {
    const contactEntry = await Contact.findByIdAndDelete(req.params.id);    
    if (!contactEntry) return res.status(404).json({ success: false, message: 'Contact entry not found' });
    res.json({ success: true, message: 'Contact entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

