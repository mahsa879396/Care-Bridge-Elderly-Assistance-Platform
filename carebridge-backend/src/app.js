import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

// Create the Express application.
const app = express();

// Only allow requests coming from the frontend client URL (from .env).
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientUrl }));

// Parse incoming JSON request bodies into req.body.
app.use(express.json());

// Mount the API routes under /api (e.g. GET /api/health).
app.use('/api', healthRoutes);

// 404 handler and central error handler must be registered last.
app.use(notFound);
app.use(errorHandler);

export default app;
