"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.getOptimizedUrl = exports.deleteFromCloudinary = exports.uploadMultipleToCloudinary = exports.cloudinaryUpload = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Create Cloudinary storage
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'leave_management', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'], // Allowed file formats
        resource_type: 'auto', // Automatically detect resource type
        public_id: (req, file) => {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `${file.fieldname}-${uniqueSuffix}`;
        },
    },
});
const fileFilter = (req, file, cb) => {
    // Allow images, PDFs, and documents
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPG, PNG, GIF), PDF, and Word documents are allowed!'));
    }
};
exports.cloudinaryUpload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});
exports.uploadMultipleToCloudinary = exports.cloudinaryUpload.array('attachments', 10); // Max 10 files
// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error deleting from Cloudinary:', errorMessage);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
// Helper function to get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
    return cloudinary_1.v2.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto',
        width: 500,
        height: 500,
        crop: 'limit',
        ...options
    });
};
exports.getOptimizedUrl = getOptimizedUrl;
//# sourceMappingURL=cloudinaryUpload.js.map