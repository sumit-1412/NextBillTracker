"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.register = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const login = async (req, res) => {
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
        const user = await User_1.default.findOne({ email });
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
        const token = (0, auth_1.generateToken)(user._id);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { email, password, fullName, staffId, role } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Create new user
        const user = new User_1.default({
            email,
            password,
            fullName,
            staffId,
            role,
        });
        await user.save();
        // Generate token
        const token = (0, auth_1.generateToken)(user._id);
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const getCurrentUser = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCurrentUser = getCurrentUser;
