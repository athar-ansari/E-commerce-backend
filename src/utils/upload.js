// utils/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

// Profile Images (500x500)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" }, // Focus on face
      { quality: "auto" },
    ],
    public_id: () =>
      `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
});

// Product Images (800x800 - larger for product details)
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit" }, // Maintain aspect ratio
      { quality: "auto" },
    ],
    public_id: () =>
      `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },
});

// Create upload instances
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (products can be larger)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

module.exports = {
  uploadProfile,
  uploadProduct,
};
