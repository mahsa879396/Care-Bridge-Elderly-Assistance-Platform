import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Roles a user is allowed to pick when registering publicly.
// "admin" is intentionally excluded so nobody can self-register as admin.
const ALLOWED_ROLES = ['senior', 'family', 'volunteer'];

// Create a JWT for a user. The payload holds only the id and role,
// and the token expires after 1 day.
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

// POST /api/auth/register
// Creates a new user and returns a token plus the user (without the password).
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, role, languages, city } = req.body;

    // 1. Every field except languages must be a non-empty value.
    const requiredFields = { firstName, lastName, email, phone, password, role, city };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // languages must be an array with at least one entry.
    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'languages must be a non-empty array' });
    }

    // 2. The role must be one of the public roles (never "admin").
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // 3. The password must have at least 8 characters.
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // 4. The email must not already be used. Look for it in lowercase.
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // 5. Create the user. The model hashes the password and (for volunteers)
    //    sets verificationStatus to "pending" before saving.
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password,
      role,
      languages,
      city,
    });

    // 6. Respond with the token and the user (password is stripped in toJSON).
    return res.status(201).json({ token: signToken(user), user: user.toJSON() });
  } catch (error) {
    // If two requests register the same email at once, MongoDB raises a
    // duplicate-key error (code 11000) -> treat it the same as "already registered".
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    // Anything else goes to the central error handler.
    return next(error);
  }
};

// POST /api/auth/login
// Checks the email and password and returns a token plus the user.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Both fields are required.
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find the user by email (stored lowercase).
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 3. Use the SAME message for a wrong email and a wrong password,
    //    so attackers cannot tell which one was wrong.
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Success: return the token and the user (without the password).
    return res.json({ token: signToken(user), user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/me
// Returns the currently logged-in user, loaded fresh from the database.
export const getMe = async (req, res, next) => {
  try {
    // req.user ({ id, role }) is set by the protect middleware.
    const user = await User.findById(req.user.id);

    // The token can be valid even after the account was deleted.
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user without the password (toJSON strips it).
    return res.json(user.toJSON());
  } catch (error) {
    return next(error);
  }
};
