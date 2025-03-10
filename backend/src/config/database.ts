import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://webautomation:123456789@localhost:27017/webautomation';

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB is already connected');
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit the process, just log the error
    console.log('Running without MongoDB - some features may be limited');
  }
}; 