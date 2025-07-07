import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  staffId?: string;
  role: 'staff' | 'admin' | 'commissioner';
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  staffId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to not be unique
  },
  role: {
    type: String,
    enum: ['staff', 'admin', 'commissioner'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User; 