"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUploadRecord = exports.getUploadHistory = exports.uploadProperties = exports.deleteProperty = exports.updateProperty = exports.getPropertyById = exports.createProperty = exports.getAllProperties = void 0;
const Property_1 = __importDefault(require("../models/Property"));
const Ward_1 = __importDefault(require("../models/Ward"));
const mongoose_1 = __importDefault(require("mongoose"));
const UploadHistory = mongoose_1.default.model('UploadHistory', new mongoose_1.default.Schema({
    filename: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    total: { type: Number, required: true },
    success: { type: Number, required: true },
    failed: { type: Number, required: true },
    duplicate: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['Success', 'Partial', 'Failed'], required: true },
    errors: [{ type: String }]
}));
// GET /api/properties - Get all properties with search and filters
const getAllProperties = async (req, res) => {
    try {
        const { search, ward, status, page = 1, limit = 20 } = req.query;
        const query = {};
        // Search by propertyId, ownerName, or address
        if (search) {
            query.$or = [
                { propertyId: { $regex: search, $options: 'i' } },
                { ownerName: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }
        // Filter by ward
        if (ward) {
            query.ward = ward;
        }
        // Filter by delivery status
        if (status) {
            query.deliveryStatus = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const properties = await Property_1.default.find(query)
            .populate('ward', 'corporateName wardName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Property_1.default.countDocuments(query);
        res.json({
            properties,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all properties error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllProperties = getAllProperties;
// POST /api/properties - Create new property
const createProperty = async (req, res) => {
    try {
        const { propertyId, ward, mohalla, ownerName, fatherName, address, houseNo, mobileNo, propertyType, location } = req.body;
        if (!propertyId || !ward || !mohalla || !ownerName || !address) {
            res.status(400).json({
                message: 'Property ID, ward, mohalla, owner name, and address are required'
            });
            return;
        }
        // Verify ward exists
        const wardExists = await Ward_1.default.findById(ward);
        if (!wardExists) {
            res.status(400).json({ message: 'Ward not found' });
            return;
        }
        const property = new Property_1.default({
            propertyId,
            ward,
            mohalla,
            ownerName,
            fatherName,
            address,
            houseNo,
            mobileNo,
            propertyType,
            location
        });
        await property.save();
        const populatedProperty = await Property_1.default.findById(property._id)
            .populate('ward', 'corporateName wardName');
        res.status(201).json(populatedProperty);
    }
    catch (error) {
        console.error('Create property error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Property ID already exists' });
            return;
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createProperty = createProperty;
// GET /api/properties/:id - Get property by ID
const getPropertyById = async (req, res) => {
    try {
        const property = await Property_1.default.findById(req.params.id)
            .populate('ward', 'corporateName wardName')
            .populate('lastDelivery');
        if (!property) {
            res.status(404).json({ message: 'Property not found' });
            return;
        }
        res.json(property);
    }
    catch (error) {
        console.error('Get property by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPropertyById = getPropertyById;
// PUT /api/properties/:id - Update property
const updateProperty = async (req, res) => {
    try {
        const property = await Property_1.default.findById(req.params.id);
        if (!property) {
            res.status(404).json({ message: 'Property not found' });
            return;
        }
        // Update fields
        Object.assign(property, req.body);
        await property.save();
        const updatedProperty = await Property_1.default.findById(property._id)
            .populate('ward', 'corporateName wardName');
        res.json(updatedProperty);
    }
    catch (error) {
        console.error('Update property error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Property ID already exists' });
            return;
        }
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProperty = updateProperty;
// DELETE /api/properties/:id - Delete property
const deleteProperty = async (req, res) => {
    try {
        const property = await Property_1.default.findByIdAndDelete(req.params.id);
        if (!property) {
            res.status(404).json({ message: 'Property not found' });
            return;
        }
        res.json({ message: 'Property deleted successfully' });
    }
    catch (error) {
        console.error('Delete property error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProperty = deleteProperty;
// POST /api/properties/upload - Upload bulk properties
const uploadProperties = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const file = req.file;
        const uploadedBy = req.user?.fullName || 'Unknown User';
        // Parse CSV/Excel file
        const csvData = file.buffer.toString('utf-8');
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            res.status(400).json({ message: 'File is empty or invalid' });
            return;
        }
        const headers = lines[0].split(',').map((h) => h.trim());
        const data = lines.slice(1);
        let total = 0;
        let success = 0;
        let failed = 0;
        let duplicate = 0;
        const errors = [];
        // Process each row
        for (let i = 0; i < data.length; i++) {
            const line = data[i];
            if (!line.trim())
                continue;
            total++;
            const values = line.split(',').map((v) => v.trim());
            try {
                // Map CSV columns to property fields
                const propertyData = {
                    propertyId: values[1] || '', // Column B
                    corporateWardNo: values[2] || '', // Column C
                    corporateName: values[3] || '', // Column D
                    wardName: values[4] || '', // Column E
                    corporateMohalla: values[5] || '', // Column F
                    propertyType: values[6] || '', // Column G
                    propertyCategory: values[7] || '', // Column H
                    ownerName: values[8] || '', // Column I
                    houseNo: values[9] || '', // Column J
                    address: values[10] || '', // Column K
                    popularName: values[11] || '', // Column L
                };
                // Validate required fields
                if (!propertyData.propertyId || !propertyData.ownerName || !propertyData.address) {
                    errors.push(`Row ${i + 2}: Missing required fields`);
                    failed++;
                    continue;
                }
                // Check for duplicate property ID
                const existingProperty = await Property_1.default.findOne({ propertyId: propertyData.propertyId });
                if (existingProperty) {
                    errors.push(`Row ${i + 2}: Property ID ${propertyData.propertyId} already exists`);
                    duplicate++;
                    continue;
                }
                // Find or create ward
                let ward = await Ward_1.default.findOne({
                    corporateName: propertyData.corporateName,
                    wardName: propertyData.wardName
                });
                if (!ward) {
                    // Create new ward if it doesn't exist
                    ward = new Ward_1.default({
                        corporateName: propertyData.corporateName,
                        wardName: propertyData.wardName,
                        mohallas: [propertyData.corporateMohalla]
                    });
                    await ward.save();
                }
                else {
                    // Add mohalla to existing ward if not present
                    if (!ward.mohallas.includes(propertyData.corporateMohalla)) {
                        ward.mohallas.push(propertyData.corporateMohalla);
                        await ward.save();
                    }
                }
                // Create property
                const property = new Property_1.default({
                    propertyId: propertyData.propertyId,
                    ward: ward._id,
                    mohalla: propertyData.corporateMohalla,
                    ownerName: propertyData.ownerName,
                    address: propertyData.address,
                    houseNo: propertyData.houseNo,
                    propertyType: propertyData.propertyType,
                    deliveryStatus: 'Pending'
                });
                await property.save();
                success++;
            }
            catch (error) {
                errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                failed++;
            }
        }
        // Determine status
        let status;
        if (failed === 0 && duplicate === 0) {
            status = 'Success';
        }
        else if (success === 0) {
            status = 'Failed';
        }
        else {
            status = 'Partial';
        }
        // Save upload record
        const uploadRecord = new UploadHistory({
            filename: file.originalname,
            uploadedBy,
            total,
            success,
            failed,
            duplicate,
            status,
            errors: errors.length > 0 ? errors : undefined
        });
        await uploadRecord.save();
        res.json({
            message: 'Upload processed',
            summary: {
                total,
                success,
                failed,
                duplicate,
                status
            },
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error('Upload properties error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadProperties = uploadProperties;
// GET /api/properties/upload/history - Get upload history
const getUploadHistory = async (req, res) => {
    try {
        const uploads = await UploadHistory.find()
            .sort({ timestamp: -1 })
            .limit(50);
        res.json({ uploads });
    }
    catch (error) {
        console.error('Get upload history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUploadHistory = getUploadHistory;
// DELETE /api/properties/upload/:id - Delete upload record
const deleteUploadRecord = async (req, res) => {
    try {
        const upload = await UploadHistory.findByIdAndDelete(req.params.id);
        if (!upload) {
            res.status(404).json({ message: 'Upload record not found' });
            return;
        }
        res.json({ message: 'Upload record deleted successfully' });
    }
    catch (error) {
        console.error('Delete upload record error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUploadRecord = deleteUploadRecord;
