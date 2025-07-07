import express from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/me - Get current user (protected)
router.get('/me', auth, getCurrentUser);

export default router; 