/**
 * Input Validators & Sanitizers
 * Centralized validation helpers for common inputs
 */

// Phone number validation (international format support)
const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Bank account validation (basic)
const validateBankAccount = (account) => {
  if (!account || typeof account !== 'string') return false;
  const cleaned = account.replace(/\s/g, '');
  return cleaned.length >= 10 && cleaned.length <= 20 && /^\w+$/.test(cleaned);
};

// Bank name validation
const validateBankName = (bankName) => {
  if (!bankName || typeof bankName !== 'string') return false;
  const trimmed = bankName.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

// Address validation
const validateAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return trimmed.length >= 5 && trimmed.length <= 500;
};

// Quantity validation
const validateQuantity = (qty) => {
  const num = Number(qty);
  return Number.isInteger(num) && num >= 1 && num <= 999;
};

// Price validation
const validatePrice = (price) => {
  const num = Number(price);
  return num > 0 && num < 10000000; // Max 10 million Naira
};

// Cloudinary URL validation
const validateCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('cloudinary.com');
  } catch {
    return false;
  }
};

// OTP validation
const validateOTP = (otp) => {
  if (!otp || typeof otp !== 'string') return false;
  return /^\d{6}$/.test(otp.trim());
};

// Password validation (min 6 chars, 1 upper, 1 lower, 1 number)
const validatePassword = (password, strict = false) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 6) return false;
  if (strict) {
    return /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }
  return true;
};

// Object ID validation (MongoDB)
const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

// Enum validation
const validateEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

// Sanitize string input
const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

// Sanitize number input
const sanitizeNumber = (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(num);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
};

// Validate cart item
const validateCartItem = (item) => {
  return {
    isValid: 
      item.menuItem && 
      validateObjectId(item.menuItem) &&
      item.name && 
      typeof item.name === 'string' &&
      validateQuantity(item.quantity) &&
      validatePrice(item.price),
    errors: {
      menuItem: !item.menuItem || !validateObjectId(item.menuItem) ? 'Invalid menu item' : null,
      name: !item.name || typeof item.name !== 'string' ? 'Item name required' : null,
      quantity: !validateQuantity(item.quantity) ? 'Invalid quantity (1-999)' : null,
      price: !validatePrice(item.price) ? 'Invalid price' : null
    }
  };
};

module.exports = {
  validatePhoneNumber,
  validateEmail,
  validateBankAccount,
  validateBankName,
  validateAddress,
  validateQuantity,
  validatePrice,
  validateCloudinaryUrl,
  validateOTP,
  validatePassword,
  validateObjectId,
  validateEnum,
  sanitizeString,
  sanitizeNumber,
  validateCartItem
};
