import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { requireStaff } from '../middleware/roles';
import { 
  createDelivery, 
  getAllDeliveries, 
  getDeliveryById, 
  updateDelivery, 
  getStaffHistory 
} from '../controllers/deliveryController';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/delivery-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'delivery-' + uniqueSuffix + '.jpg');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/deliveries/upload-photo - Upload delivery photo
router.post('/upload-photo', auth, requireStaff, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No photo uploaded' });
      return;
    }
    
    // Generate full URL for the uploaded photo
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const photoUrl = `${baseUrl}/uploads/delivery-photos/${req.file.filename}`;
    res.json({ 
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// POST /api/deliveries - Create new delivery
router.post('/', auth, requireStaff, createDelivery);

// GET /api/deliveries - Get all deliveries (Admin/Commissioner)
router.get('/', auth, getAllDeliveries);

// GET /api/deliveries/staff-history - Get staff's delivery history
router.get('/staff-history', auth, requireStaff, getStaffHistory);

// GET /api/deliveries/:id - Get delivery by ID
router.get('/:id', auth, getDeliveryById);

// PUT /api/deliveries/:id - Update delivery
router.put('/:id', auth, requireStaff, updateDelivery);

export default router; 