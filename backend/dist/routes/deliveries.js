"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const roles_1 = require("../middleware/roles");
const deliveryController_1 = require("../controllers/deliveryController");
const cloudinary_1 = __importDefault(require("cloudinary"));
const fs_1 = __importDefault(require("fs"));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const router = express_1.default.Router();
// Configure multer for photo uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/delivery-photos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'delivery-' + uniqueSuffix + '.jpg');
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// POST /api/deliveries/upload-photo - Upload delivery photo
router.post('/upload-photo', auth_1.auth, roles_1.requireStaff, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No photo uploaded' });
            return;
        }
        // Upload to Cloudinary
        const result = await cloudinary_1.default.v2.uploader.upload(req.file.path, {
            folder: 'delivery-photos',
            resource_type: 'image',
        });
        // Remove local file after upload
        fs_1.default.unlinkSync(req.file.path);
        res.json({
            message: 'Photo uploaded successfully',
            photoUrl: result.secure_url,
        });
    }
    catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({ message: 'Failed to upload photo' });
    }
});
// POST /api/deliveries - Create new delivery
router.post('/', auth_1.auth, roles_1.requireStaff, deliveryController_1.createDelivery);
// GET /api/deliveries - Get all deliveries (Admin/Commissioner)
router.get('/', auth_1.auth, deliveryController_1.getAllDeliveries);
// GET /api/deliveries/staff-history - Get staff's delivery history
router.get('/staff-history', auth_1.auth, roles_1.requireStaff, deliveryController_1.getStaffHistory);
// GET /api/deliveries/:id - Get delivery by ID
router.get('/:id', auth_1.auth, deliveryController_1.getDeliveryById);
// PUT /api/deliveries/:id - Update delivery
router.put('/:id', auth_1.auth, roles_1.requireStaff, deliveryController_1.updateDelivery);
exports.default = router;
