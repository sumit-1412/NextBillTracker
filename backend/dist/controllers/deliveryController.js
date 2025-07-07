"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDelivery = exports.getDeliveryById = exports.getStaffHistory = exports.getAllDeliveries = exports.createDelivery = void 0;
const Delivery_1 = __importDefault(require("../models/Delivery"));
const Property_1 = __importDefault(require("../models/Property"));
// POST /api/deliveries - Create new delivery (Staff only)
const createDelivery = async (req, res) => {
    try {
        const { property, dataSource, receiverName, receiverMobile, photoUrl, location, remarks } = req.body;
        if (!property || !dataSource || !photoUrl || !location) {
            res.status(400).json({
                message: 'Property, data source, photo URL, and location are required'
            });
            return;
        }
        // Verify property exists
        const propertyExists = await Property_1.default.findById(property);
        if (!propertyExists) {
            res.status(400).json({ message: 'Property not found' });
            return;
        }
        // Create delivery
        const delivery = new Delivery_1.default({
            property,
            staff: req.user._id,
            dataSource,
            receiverName,
            receiverMobile,
            photoUrl,
            location,
            remarks
        });
        await delivery.save();
        // Update property delivery status
        const deliveryStatus = dataSource === 'not_found' ? 'Not Found' : 'Delivered';
        await Property_1.default.findByIdAndUpdate(property, {
            deliveryStatus,
            lastDelivery: delivery._id
        });
        const populatedDelivery = await Delivery_1.default.findById(delivery._id)
            .populate('property', 'propertyId ownerName address')
            .populate('staff', 'fullName staffId');
        res.status(201).json(populatedDelivery);
    }
    catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createDelivery = createDelivery;
// GET /api/deliveries - Get all deliveries (Admin/Commissioner)
const getAllDeliveries = async (req, res) => {
    try {
        const { staff, property, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
        const query = {};
        // Filter by staff
        if (staff) {
            query.staff = staff;
        }
        // Filter by property
        if (property) {
            query.property = property;
        }
        // Filter by correction status
        if (status) {
            query.correctionStatus = status;
        }
        // Filter by date range
        if (dateFrom || dateTo) {
            query.deliveryDate = {};
            if (dateFrom)
                query.deliveryDate.$gte = new Date(dateFrom);
            if (dateTo)
                query.deliveryDate.$lte = new Date(dateTo);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const deliveries = await Delivery_1.default.find(query)
            .populate('property', 'propertyId ownerName address')
            .populate('staff', 'fullName staffId')
            .sort({ deliveryDate: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Delivery_1.default.countDocuments(query);
        res.json({
            deliveries,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all deliveries error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllDeliveries = getAllDeliveries;
// GET /api/deliveries/staff-history - Get staff's delivery history
const getStaffHistory = async (req, res) => {
    try {
        const { dateFrom, dateTo, page = 1, limit = 20 } = req.query;
        const query = { staff: req.user._id };
        // Filter by date range
        if (dateFrom || dateTo) {
            query.deliveryDate = {};
            if (dateFrom)
                query.deliveryDate.$gte = new Date(dateFrom);
            if (dateTo)
                query.deliveryDate.$lte = new Date(dateTo);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const deliveries = await Delivery_1.default.find(query)
            .populate('property', 'propertyId ownerName address')
            .sort({ deliveryDate: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await Delivery_1.default.countDocuments(query);
        res.json({
            deliveries,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get staff history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getStaffHistory = getStaffHistory;
// GET /api/deliveries/:id - Get delivery by ID
const getDeliveryById = async (req, res) => {
    try {
        const delivery = await Delivery_1.default.findById(req.params.id)
            .populate('property', 'propertyId ownerName address')
            .populate('staff', 'fullName staffId');
        if (!delivery) {
            res.status(404).json({ message: 'Delivery not found' });
            return;
        }
        res.json(delivery);
    }
    catch (error) {
        console.error('Get delivery by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDeliveryById = getDeliveryById;
// PUT /api/deliveries/:id - Update delivery
const updateDelivery = async (req, res) => {
    try {
        const delivery = await Delivery_1.default.findById(req.params.id);
        if (!delivery) {
            res.status(404).json({ message: 'Delivery not found' });
            return;
        }
        // Only allow staff to update their own deliveries
        if (delivery.staff.toString() !== req.user._id) {
            res.status(403).json({ message: 'Not authorized to update this delivery' });
            return;
        }
        // Update fields
        Object.assign(delivery, req.body);
        await delivery.save();
        const updatedDelivery = await Delivery_1.default.findById(delivery._id)
            .populate('property', 'propertyId ownerName address')
            .populate('staff', 'fullName staffId');
        res.json(updatedDelivery);
    }
    catch (error) {
        console.error('Update delivery error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateDelivery = updateDelivery;
