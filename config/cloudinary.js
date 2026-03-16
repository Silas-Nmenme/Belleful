const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration & Upload Helper
 * Optimized for menu images & payment receipts
 * Auto-resize/crop for performance
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload single image with transformations
 * @param {string} folder - 'menu' | 'receipts' | default 'belleful'
 * @param {object} options - additional Cloudinary params
 * @returns {Promise} upload result
 */
const uploadImage = (folder = 'belleful', options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

/**
 * Delete image by public_id
 */
const deleteImage = (public_id) => cloudinary.uploader.destroy(public_id);

module.exports = { cloudinary, uploadImage, deleteImage };

