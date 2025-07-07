import { Request, Response } from 'express';
import Delivery from '../models/Delivery';
import Property from '../models/Property';

// POST /api/deliveries - Create new delivery (Staff only)
export const createDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      property,
      dataSource,
      receiverName,
      receiverMobile,
      photoUrl,
      location,
      remarks
    } = req.body;

    if (!property || !dataSource || !photoUrl || !location) {
      res.status(400).json({ 
        message: 'Property, data source, photo URL, and location are required' 
      });
      return;
    }

    // Verify property exists
    const propertyExists = await Property.findById(property);
    if (!propertyExists) {
      res.status(400).json({ message: 'Property not found' });
      return;
    }

    // Create delivery
    const delivery = new Delivery({
      property,
      staff: req.user!._id,
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
    await Property.findByIdAndUpdate(property, {
      deliveryStatus,
      lastDelivery: delivery._id
    });

    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('property', 'propertyId ownerName address')
      .populate('staff', 'fullName staffId');

    res.status(201).json(populatedDelivery);
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/deliveries - Get all deliveries (Admin/Commissioner)
export const getAllDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      staff, 
      property, 
      status, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;

    const query: any = {};

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
      if (dateFrom) query.deliveryDate.$gte = new Date(dateFrom as string);
      if (dateTo) query.deliveryDate.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const deliveries = await Delivery.find(query)
      .populate('property', 'propertyId ownerName address')
      .populate('staff', 'fullName staffId')
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/deliveries/staff-history - Get staff's delivery history
export const getStaffHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;

    const query: any = { staff: req.user!._id };

    // Filter by date range
    if (dateFrom || dateTo) {
      query.deliveryDate = {};
      if (dateFrom) query.deliveryDate.$gte = new Date(dateFrom as string);
      if (dateTo) query.deliveryDate.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const deliveries = await Delivery.find(query)
      .populate('property', 'propertyId ownerName address')
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get staff history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/deliveries/:id - Get delivery by ID
export const getDeliveryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('property', 'propertyId ownerName address')
      .populate('staff', 'fullName staffId');

    if (!delivery) {
      res.status(404).json({ message: 'Delivery not found' });
      return;
    }
    res.json(delivery);
  } catch (error) {
    console.error('Get delivery by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/deliveries/:id - Update delivery
export const updateDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      res.status(404).json({ message: 'Delivery not found' });
      return;
    }

    // Only allow staff to update their own deliveries
    if (delivery.staff.toString() !== (req.user!._id as string)) {
      res.status(403).json({ message: 'Not authorized to update this delivery' });
      return;
    }

    // Update fields
    Object.assign(delivery, req.body);
    await delivery.save();
    
    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate('property', 'propertyId ownerName address')
      .populate('staff', 'fullName staffId');
    
    res.json(updatedDelivery);
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 