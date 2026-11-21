import { Router } from 'express';
import { register, login } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register -> create a new account and return a token.
router.post('/register', register);

// POST /api/auth/login -> log in with email and password and return a token.
router.post('/login', login);

export default router;
