import mongoose, { Document, Model } from 'mongoose';

export interface IDelivery extends Document {
  property: mongoose.Types.ObjectId;
  staff: mongoose.Types.ObjectId;
  deliveryDate: Date;
  dataSource: 'owner' | 'family' | 'tenant' | 'not_found';
  receiverName?: string;
  receiverMobile?: string;
  photoUrl: string;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };
  remarks?: string;
  correctionStatus: 'None' | 'Pending' | 'Approved' | 'Rejected';
}

const deliverySchema = new mongoose.Schema<IDelivery>({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deliveryDate: {
    type: Date,
    default: Date.now,
  },
  dataSource: {
    type: String,
    enum: ['owner', 'family', 'tenant', 'not_found'],
    required: true,
  },
  receiverName: String,
  receiverMobile: String,
  photoUrl: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  remarks: String,
  correctionStatus: {
    type: String,
    enum: ['None', 'Pending', 'Approved', 'Rejected'],
    default: 'None',
  }
}, { timestamps: true });

const Delivery: Model<IDelivery> = mongoose.model<IDelivery>('Delivery', deliverySchema);
export default Delivery; 