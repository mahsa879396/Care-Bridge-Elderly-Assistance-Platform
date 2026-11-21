import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getMyRequests,
  getRequestById,
} from '../controllers/requestController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// Every route below needs a valid token (protect runs first for all of them).
router.use(protect);

// POST /api/requests -> a senior creates a new request.
router.post('/', requireRole('senior'), createRequest);

// GET /api/requests -> a volunteer browses open (Pending) requests.
router.get('/', requireRole('volunteer'), getRequests);

// GET /api/requests/mine -> the logged-in user's own requests.
// This must be declared BEFORE "/:id" so "mine" is not treated as an id.
router.get('/mine', getMyRequests);

// GET /api/requests/:id -> one request (owner, assigned volunteer, or verified volunteer).
router.get('/:id', getRequestById);

export default router;
