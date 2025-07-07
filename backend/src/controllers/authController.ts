import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      res.status(400).json({ 
        message: 'Email, password, and role are required' 
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ message: 'Account is deactivated' });
      return;
    }

    // Verify role
    if (user.role !== role) {
      res.status(401).json({ message: 'Invalid role for this user' });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id as string);

    // Return user data (without password) and token
    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      staffId: user.staffId,
      role: user.role,
      isActive: user.isActive,
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, staffId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      staffId,
      role,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id as string);

    // Return user data (without password) and token
    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      staffId: user.staffId,
      role: user.role,
      isActive: user.isActive,
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        staffId: req.user.staffId,
        role: req.user.role,
        isActive: req.user.isActive,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 