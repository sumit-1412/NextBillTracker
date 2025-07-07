import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Ward from '../models/Ward';
import Property from '../models/Property';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nextbill';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Ward.deleteMany({});
    await Property.deleteMany({});
    console.log('Cleared existing data');

    // Create wards
    const wards = await Ward.insertMany([
      {
        corporateName: 'Municipal Corporation of Delhi',
        wardName: 'Ward 1',
        mohallas: ['Lajpat Nagar', 'Kalkaji', 'Greater Kailash']
      },
      {
        corporateName: 'Municipal Corporation of Delhi',
        wardName: 'Ward 2',
        mohallas: ['Hauz Khas', 'Green Park', 'SDA Market']
      },
      {
        corporateName: 'Municipal Corporation of Delhi',
        wardName: 'Ward 3',
        mohallas: ['Connaught Place', 'Karol Bagh', 'Rajendra Nagar']
      }
    ]);
    console.log('Created wards:', wards.length);

    // Create users
    const userData = [
      {
        email: 'admin@nextbill.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'admin',
        isActive: true
      },
      {
        email: 'staff1@nextbill.com',
        password: 'staff123',
        fullName: 'Ravi Kumar',
        staffId: 'STAFF001',
        role: 'staff',
        isActive: true
      },
      {
        email: 'staff2@nextbill.com',
        password: 'staff123',
        fullName: 'Priya Sharma',
        staffId: 'STAFF002',
        role: 'staff',
        isActive: true
      },
      {
        email: 'commissioner@nextbill.com',
        password: 'comm123',
        fullName: 'Commissioner Singh',
        role: 'commissioner',
        isActive: true
      }
    ];

    const users = [];
    for (const userInfo of userData) {
      const user = new User(userInfo);
      await user.save();
      users.push(user);
    }
    console.log('Created users:', users.length);

    // Create properties
    const properties = await Property.insertMany([
      {
        propertyId: 'PROP001',
        ward: wards[0]._id,
        mohalla: 'Lajpat Nagar',
        ownerName: 'Rajesh Kumar',
        fatherName: 'Suresh Kumar',
        address: '123, Lajpat Nagar, New Delhi',
        houseNo: '123',
        mobileNo: '9876543210',
        propertyType: 'Residential',
        deliveryStatus: 'Pending'
      },
      {
        propertyId: 'PROP002',
        ward: wards[0]._id,
        mohalla: 'Kalkaji',
        ownerName: 'Meera Patel',
        fatherName: 'Ramesh Patel',
        address: '456, Kalkaji Extension, New Delhi',
        houseNo: '456',
        mobileNo: '9876543211',
        propertyType: 'Residential',
        deliveryStatus: 'Pending'
      },
      {
        propertyId: 'PROP003',
        ward: wards[1]._id,
        mohalla: 'Hauz Khas',
        ownerName: 'Amit Singh',
        fatherName: 'Harinder Singh',
        address: '789, Hauz Khas Village, New Delhi',
        houseNo: '789',
        mobileNo: '9876543212',
        propertyType: 'Commercial',
        deliveryStatus: 'Pending'
      },
      {
        propertyId: 'PROP004',
        ward: wards[1]._id,
        mohalla: 'Green Park',
        ownerName: 'Sunita Verma',
        fatherName: 'Rajesh Verma',
        address: '321, Green Park Extension, New Delhi',
        houseNo: '321',
        mobileNo: '9876543213',
        propertyType: 'Residential',
        deliveryStatus: 'Pending'
      },
      {
        propertyId: 'PROP005',
        ward: wards[2]._id,
        mohalla: 'Connaught Place',
        ownerName: 'Vikram Malhotra',
        fatherName: 'Suresh Malhotra',
        address: '654, Connaught Place, New Delhi',
        houseNo: '654',
        mobileNo: '9876543214',
        propertyType: 'Commercial',
        deliveryStatus: 'Pending'
      }
    ]);
    console.log('Created properties:', properties.length);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@nextbill.com / admin123');
    console.log('Staff 1: staff1@nextbill.com / staff123');
    console.log('Staff 2: staff2@nextbill.com / staff123');
    console.log('Commissioner: commissioner@nextbill.com / comm123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedData(); 