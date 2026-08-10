const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpxxxxxxxxx",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789",
  api_secret: process.env.CLOUDINARY_API_SECRET || "abcdefghijk",
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const streamUpload = (fileBuffer, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    // If keys are not set, return a mock success for local development
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME.startsWith("dpx")
    ) {
      console.warn("Cloudinary keys not set. Returning placeholder URL.");
      return resolve({
        secure_url:
          resourceType === "video"
            ? "https://res.cloudinary.com/demo/video/upload/dog.mp4"
            : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200",
      });
    }

    let stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.write(fileBuffer);
    stream.end();
  });
};

module.exports = {
  upload,
  streamUpload,
  cloudinary,
};
