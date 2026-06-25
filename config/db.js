import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('cluster.mongodb.net') || uri.includes('username:password')) {
    console.error('\n❌ Invalid MONGODB_URI in server/.env');
    console.error('   You are still using the placeholder connection string.');
    console.error('   Get a real URI from MongoDB Atlas → Connect → Drivers');
    console.error('   Example: mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/startupforge\n');
    process.exit(1);
  }

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
