const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an in-memory file buffer directly to Cloudinary using streamifier.
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} [folder='mist_lms/materials'] - Destination folder in Cloudinary
 * @param {object} [options={}] - Additional options for Cloudinary upload
 * @returns {Promise<{ secure_url: string, public_id: string, [key: string]: any }>}
 */
const uploadToCloudinary = (fileBuffer, folder = 'mist_lms/materials', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: options.resource_type || 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
