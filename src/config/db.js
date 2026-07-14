import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cd-store';
    await mongoose.connect(mongoUri);
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};
