import express from 'express';
import { 
  getAllProperties, 
  createProperty, 
  getPropertyById, 
  updateProperty, 
  deleteProperty,
  uploadProperties,
  getUploadHistory,
  deleteUploadRecord
} from '../controllers/propertyController';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 60 * 1024 * 1024 // 60MB limit
  }
});

// GET /api/properties - Get all properties with search and filters (accessible by all authenticated users)
router.get('/', auth, getAllProperties);

// POST /api/properties - Create new property (Admin only)
router.post('/', auth, requireAdmin, createProperty);

// GET /api/properties/:id - Get property by ID
router.get('/:id', auth, getPropertyById);

// PUT /api/properties/:id - Update property (Admin only)
router.put('/:id', auth, requireAdmin, updateProperty);

// DELETE /api/properties/:id - Delete property (Admin only)
router.delete('/:id', auth, requireAdmin, deleteProperty);

// POST /api/properties/upload - Upload bulk properties (Admin only)
router.post('/upload', auth, requireAdmin, upload.single('file'), uploadProperties);

// GET /api/properties/upload/history - Get upload history (Admin only)
router.get('/upload/history', auth, requireAdmin, getUploadHistory);

// DELETE /api/properties/upload/:id - Delete upload record (Admin only)
router.delete('/upload/:id', auth, requireAdmin, deleteUploadRecord);

export default router; 