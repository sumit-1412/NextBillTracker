import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB config
const MONGODB_URI = process.env.MONGODB_URI || '';
const uploadsDir = path.resolve(__dirname, '../uploads/delivery-photos');

// Delivery model (minimal)
const deliverySchema = new mongoose.Schema({
  photoUrl: String,
}, { strict: false });
const Delivery = mongoose.model('Delivery', deliverySchema, 'deliveries');

async function migratePhotos() {
  await mongoose.connect(MONGODB_URI);
  const files = fs.readdirSync(uploadsDir);
  let migrated = 0;
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    if (!fs.statSync(filePath).isFile()) continue;
    try {
      // Upload to Cloudinary
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: 'delivery-photos',
        resource_type: 'image',
      });
      // Update delivery record
      const updateRes = await Delivery.findOneAndUpdate(
        { photoUrl: { $regex: file } },
        { photoUrl: result.secure_url }
      );
      if (updateRes) {
        migrated++;
        fs.unlinkSync(filePath);
        console.log(`Migrated: ${file} -> ${result.secure_url}`);
      } else {
        console.warn(`No delivery found for: ${file}`);
      }
    } catch (err) {
      console.error(`Failed to migrate ${file}:`, err);
    }
  }
  await mongoose.disconnect();
  console.log(`Migration complete. Migrated ${migrated} files.`);
}

migratePhotos(); 