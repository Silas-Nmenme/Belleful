const cloudinary = require('cloudinary').v2;

/**
 * Cloudinary Configuration & Upload Helper
 * Direct frontend uploads + server delete
 */
console.log('☁️ Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  CLOUDINARY_CLOUD_NAME missing - uploads will fail');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get direct upload URL + params for frontend
 * Create unsigned preset 'belleful-uploads' in Cloudinary dashboard
 * @param {string} folder - 'menu', 'receipts', default 'belleful'
 * @param {object} options - additional params
 * @returns {object} { url, params } for FormData
 */
const getUploadUrl = (folder = 'belleful', options = {}) => {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/image/upload`;
  
  const params = new URLSearchParams({
    upload_preset: 'belleful-uploads', // Create this unsigned preset in dashboard
    folder,
    transformation: JSON.stringify([
      { width: 800, height: 600, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ]),
    ...options
  });

  return {
    url: `${uploadUrl}?${params.toString()}`,
    method: 'POST',
    fields: Object.fromEntries(params)
  };
};

/**
 * Server-side upload from stream/buffer (kept for legacy)
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

module.exports = { cloudinary, uploadImage, deleteImage, getUploadUrl };
