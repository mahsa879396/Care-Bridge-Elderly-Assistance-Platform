import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /api/health -> check that the API is up and MongoDB is connected.
router.get('/health', getHealth);

export default router;
