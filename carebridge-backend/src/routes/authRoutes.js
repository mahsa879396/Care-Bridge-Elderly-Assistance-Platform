import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register -> create a new account and return a token.
router.post('/register', register);

// POST /api/auth/login -> log in with email and password and return a token.
router.post('/login', login);

// GET /api/auth/me -> return the logged-in user.
// protect runs first and rejects the request if the token is missing or invalid.
router.get('/me', protect, getMe);

export default router;
