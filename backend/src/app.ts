import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth';
import wardRoutes from './routes/wards';
import propertyRoutes from './routes/properties';
import deliveryRoutes from './routes/deliveries';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || '';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
