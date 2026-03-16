const multer = require('multer');
const path = require('path');

/**
 * Multer Config - Image uploads only
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

module.exports = multer({ storage, fileFilter, limits });

