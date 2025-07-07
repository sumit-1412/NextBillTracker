import { Request, Response } from 'express';
import Ward from '../models/Ward';

// GET /api/wards - Get all wards
export const getAllWards = async (req: Request, res: Response): Promise<void> => {
  try {
    const wards = await Ward.find().sort({ corporateName: 1, wardName: 1 });
    res.json(wards);
  } catch (error) {
    console.error('Get all wards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/wards - Create new ward
export const createWard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { corporateName, wardName, mohallas } = req.body;

    if (!corporateName || !wardName) {
      res.status(400).json({ message: 'Corporate name and ward name are required' });
      return;
    }

    const ward = new Ward({
      corporateName,
      wardName,
      mohallas: mohallas || [],
    });

    await ward.save();
    res.status(201).json(ward);
  } catch (error: any) {
    console.error('Create ward error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ward already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/wards/:id - Get ward by ID
export const getWardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      res.status(404).json({ message: 'Ward not found' });
      return;
    }
    res.json(ward);
  } catch (error) {
    console.error('Get ward by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/wards/:id - Update ward
export const updateWard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { corporateName, wardName, mohallas } = req.body;

    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      res.status(404).json({ message: 'Ward not found' });
      return;
    }

    ward.corporateName = corporateName || ward.corporateName;
    ward.wardName = wardName || ward.wardName;
    ward.mohallas = mohallas || ward.mohallas;

    await ward.save();
    res.json(ward);
  } catch (error: any) {
    console.error('Update ward error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ward already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/wards/:id - Delete ward
export const deleteWard = async (req: Request, res: Response): Promise<void> => {
  try {
    const ward = await Ward.findByIdAndDelete(req.params.id);
    if (!ward) {
      res.status(404).json({ message: 'Ward not found' });
      return;
    }
    res.json({ message: 'Ward deleted successfully' });
  } catch (error) {
    console.error('Delete ward error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 