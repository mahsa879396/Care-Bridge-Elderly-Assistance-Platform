import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import { createManagedSenior, getManagedSeniors } from '../controllers/familyController.js';

const router = Router();

// Every route needs a valid token AND the "family" role.
router.use(protect, requireRole('family'));

// POST /api/family/seniors -> create a senior profile for a relative.
router.post('/seniors', createManagedSenior);

// GET /api/family/seniors -> the seniors this family member manages.
router.get('/seniors', getManagedSeniors);

export default router;
