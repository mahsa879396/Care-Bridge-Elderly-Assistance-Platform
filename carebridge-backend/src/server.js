// Load variables from the .env file into process.env.
// This must run before app.js reads any environment variables.
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

// Use the PORT from .env, or fall back to 5000.
const PORT = process.env.PORT || 5000;

// Start the server: first connect to MongoDB, then start listening.
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    // Clear error message when MONGODB_URI is missing or the connection fails.
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('   Check that MONGODB_URI is set correctly in your .env file.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CareBridge API running on http://localhost:${PORT}`);
  });
};

startServer();
