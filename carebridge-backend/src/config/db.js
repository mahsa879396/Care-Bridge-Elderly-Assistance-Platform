import mongoose from 'mongoose';

// Connect to MongoDB using the connection string from .env.
// Throws a clear error if the URI is missing or the connection fails,
// so server.js can print a helpful message and stop.
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  // mongoose.connect returns a promise that rejects on connection failure.
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');

  return mongoose.connection;
};
