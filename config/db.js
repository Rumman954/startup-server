import mongoose from 'mongoose';
import { resolveMongoUri } from './getMongoUri.js';

const connectDB = async () => {
  const uri = await resolveMongoUri();

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.error('   Check your cluster hostname in MONGODB_URI (copy it again from Atlas).');
    }
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('   Check your database username and password in MONGODB_URI.');
    }
    process.exit(1);
  }
};

export default connectDB;
