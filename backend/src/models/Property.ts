import mongoose, { Document, Model } from 'mongoose';

export interface IProperty extends Document {
  propertyId: string;
  ward: mongoose.Types.ObjectId;
  mohalla: string;
  ownerName: string;
  fatherName?: string;
  address: string;
  houseNo?: string;
  mobileNo?: string;
  propertyType?: string;
  location?: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  deliveryStatus: 'Pending' | 'Delivered' | 'Not Found';
  lastDelivery?: mongoose.Types.ObjectId;
}

const propertySchema = new mongoose.Schema<IProperty>({
  propertyId: {
    type: String,
    required: true,
    unique: true,
  },
  ward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
  },
  mohalla: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  fatherName: String,
  address: {
    type: String,
    required: true,
  },
  houseNo: String,
  mobileNo: String,
  propertyType: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Delivered', 'Not Found'],
    default: 'Pending',
  },
  lastDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
  }
}, { timestamps: true });

const Property: Model<IProperty> = mongoose.model<IProperty>('Property', propertySchema);
export default Property; 