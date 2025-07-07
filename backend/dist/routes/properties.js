"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const propertyController_1 = require("../controllers/propertyController");
const auth_1 = require("../middleware/auth");
const roles_1 = require("../middleware/roles");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    },
    limits: {
        fileSize: 60 * 1024 * 1024 // 60MB limit
    }
});
// GET /api/properties - Get all properties with search and filters (accessible by all authenticated users)
router.get('/', auth_1.auth, propertyController_1.getAllProperties);
// POST /api/properties - Create new property (Admin only)
router.post('/', auth_1.auth, roles_1.requireAdmin, propertyController_1.createProperty);
// GET /api/properties/:id - Get property by ID
router.get('/:id', auth_1.auth, propertyController_1.getPropertyById);
// PUT /api/properties/:id - Update property (Admin only)
router.put('/:id', auth_1.auth, roles_1.requireAdmin, propertyController_1.updateProperty);
// DELETE /api/properties/:id - Delete property (Admin only)
router.delete('/:id', auth_1.auth, roles_1.requireAdmin, propertyController_1.deleteProperty);
// POST /api/properties/upload - Upload bulk properties (Admin only)
router.post('/upload', auth_1.auth, roles_1.requireAdmin, upload.single('file'), propertyController_1.uploadProperties);
// GET /api/properties/upload/history - Get upload history (Admin only)
router.get('/upload/history', auth_1.auth, roles_1.requireAdmin, propertyController_1.getUploadHistory);
// DELETE /api/properties/upload/:id - Delete upload record (Admin only)
router.delete('/upload/:id', auth_1.auth, roles_1.requireAdmin, propertyController_1.deleteUploadRecord);
exports.default = router;
