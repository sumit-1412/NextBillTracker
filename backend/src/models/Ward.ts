import mongoose, { Document, Model } from 'mongoose';

export interface IWard extends Document {
  corporateName: string;
  wardName: string;
  mohallas: string[];
}

const wardSchema = new mongoose.Schema<IWard>({
  corporateName: {
    type: String,
    required: true,
  },
  wardName: {
    type: String,
    required: true,
  },
  mohallas: [{
    type: String,
  }],
}, { timestamps: true });

// Ensure the combination of corporateName and wardName is unique
wardSchema.index({ corporateName: 1, wardName: 1 }, { unique: true });

const Ward: Model<IWard> = mongoose.model<IWard>('Ward', wardSchema);
export default Ward; 