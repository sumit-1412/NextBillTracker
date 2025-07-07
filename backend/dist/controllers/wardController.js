"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWard = exports.updateWard = exports.getWardById = exports.createWard = exports.getAllWards = void 0;
const Ward_1 = __importDefault(require("../models/Ward"));
// GET /api/wards - Get all wards
const getAllWards = async (req, res) => {
    try {
        const wards = await Ward_1.default.find().sort({ corporateName: 1, wardName: 1 });
        res.json(wards);
    }
    catch (error) {
        console.error('Get all wards error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllWards = getAllWards;
// POST /api/wards - Create new ward
const createWard = async (req, res) => {
    try {
        const { corporateName, wardName, mohallas } = req.body;
        if (!corporateName || !wardName) {
            res.status(400).json({ message: 'Corporate name and ward name are required' });
            return;
        }
        const ward = new Ward_1.default({
            corporateName,
            wardName,
            mohallas: mohallas || [],
        });
        await ward.save();
        res.status(201).json(ward);
    }
    catch (error) {
        console.error('Create ward error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Ward already exists' });
            return;
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createWard = createWard;
// GET /api/wards/:id - Get ward by ID
const getWardById = async (req, res) => {
    try {
        const ward = await Ward_1.default.findById(req.params.id);
        if (!ward) {
            res.status(404).json({ message: 'Ward not found' });
            return;
        }
        res.json(ward);
    }
    catch (error) {
        console.error('Get ward by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getWardById = getWardById;
// PUT /api/wards/:id - Update ward
const updateWard = async (req, res) => {
    try {
        const { corporateName, wardName, mohallas } = req.body;
        const ward = await Ward_1.default.findById(req.params.id);
        if (!ward) {
            res.status(404).json({ message: 'Ward not found' });
            return;
        }
        ward.corporateName = corporateName || ward.corporateName;
        ward.wardName = wardName || ward.wardName;
        ward.mohallas = mohallas || ward.mohallas;
        await ward.save();
        res.json(ward);
    }
    catch (error) {
        console.error('Update ward error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Ward already exists' });
            return;
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateWard = updateWard;
// DELETE /api/wards/:id - Delete ward
const deleteWard = async (req, res) => {
    try {
        const ward = await Ward_1.default.findByIdAndDelete(req.params.id);
        if (!ward) {
            res.status(404).json({ message: 'Ward not found' });
            return;
        }
        res.json({ message: 'Ward deleted successfully' });
    }
    catch (error) {
        console.error('Delete ward error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteWard = deleteWard;
