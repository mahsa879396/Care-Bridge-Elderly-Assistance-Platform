import mongoose from 'mongoose';

// GET /api/health
// Reports whether the API is running and whether the database is connected.
export const getHealth = (req, res) => {
  // In mongoose, readyState === 1 means the connection is active.
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    // Database is not connected -> report an error with status 500.
    return res.status(500).json({ status: 'error', database: 'disconnected' });
  }

  return res.json({ status: 'ok', database: 'connected' });
};
