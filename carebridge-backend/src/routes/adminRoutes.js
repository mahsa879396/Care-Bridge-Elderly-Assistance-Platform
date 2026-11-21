import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  listVolunteers,
  verifyVolunteer,
  rejectVolunteer,
  listUsers,
  listRequests,
  getStats,
} from '../controllers/adminController.js';

const router = Router();

// Every admin route needs a valid token AND the "admin" role.
// protect returns 401 when the token is missing/invalid; requireRole returns 403
// for any user who is not an admin.
router.use(protect, requireRole('admin'));

// GET /api/admin/volunteers -> list volunteers (filter with ?status=).
router.get('/volunteers', listVolunteers);

// PATCH /api/admin/volunteers/:id/verify -> approve a volunteer.
router.patch('/volunteers/:id/verify', verifyVolunteer);

// PATCH /api/admin/volunteers/:id/reject -> reject a volunteer.
router.patch('/volunteers/:id/reject', rejectVolunteer);

// GET /api/admin/users -> list users (filter with ?role=).
router.get('/users', listUsers);

// GET /api/admin/requests -> list all requests (filter with ?status=).
router.get('/requests', listRequests);

// GET /api/admin/stats -> dashboard counts.
router.get('/stats', getStats);

export default router;
