import express from 'express';
import { 
  getAllWards, 
  createWard, 
  getWardById, 
  updateWard, 
  deleteWard 
} from '../controllers/wardController';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const router = express.Router();

// GET /api/wards - Get all wards (accessible by all authenticated users)
router.get('/', auth, getAllWards);

// POST /api/wards - Create new ward (Admin only)
router.post('/', auth, requireAdmin, createWard);

// GET /api/wards/:id - Get ward by ID (accessible by all authenticated users)
router.get('/:id', auth, getWardById);

// PUT /api/wards/:id - Update ward (Admin only)
router.put('/:id', auth, requireAdmin, updateWard);

// DELETE /api/wards/:id - Delete ward (Admin only)
router.delete('/:id', auth, requireAdmin, deleteWard);

export default router; 