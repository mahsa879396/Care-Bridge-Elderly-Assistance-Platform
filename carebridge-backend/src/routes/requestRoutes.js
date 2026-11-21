import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getMyRequests,
  getRequestById,
  acceptRequest,
  completeRequest,
  rateRequest,
  cancelRequest,
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

// PATCH /api/requests/:id/accept -> a verified volunteer accepts a waiting request.
router.patch('/:id/accept', requireRole('volunteer'), acceptRequest);

// PATCH /api/requests/:id/complete -> the senior or the assigned volunteer marks it done.
router.patch('/:id/complete', completeRequest);

// PATCH /api/requests/:id/rate -> the senior rates the volunteer after completion.
router.patch('/:id/rate', requireRole('senior'), rateRequest);

// DELETE /api/requests/:id -> the senior cancels a request that is still waiting.
router.delete('/:id', requireRole('senior'), cancelRequest);

export default router;
