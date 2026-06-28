import mongoose from 'mongoose';
import { resolveMongoUri } from './getMongoUri.js';

const globalCache = globalThis;

if (!globalCache.__mongooseCache) {
  globalCache.__mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const cache = globalCache.__mongooseCache;

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const uri = await resolveMongoUri();
    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        cache.promise = null;
        console.error('MongoDB connection error:', error.message);
        if (error.message.includes('ENOTFOUND')) {
          console.error('   Check your cluster hostname in MONGODB_URI.');
        }
        if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
          console.error('   Check your database username and password in MONGODB_URI.');
        }
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

export default connectDB;
