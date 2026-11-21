import crypto from 'crypto';
import User from '../models/User.js';

// POST /api/family/seniors  (family only)
// A family member creates a senior profile for a relative who does not use the internet.
export const createManagedSenior = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, city, languages, consent } = req.body;

    // 1. Every text field must be present.
    const requiredFields = { firstName, lastName, phone, city };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // languages must be an array with at least one entry.
    if (!Array.isArray(languages) || languages.length === 0) {
      return res.status(400).json({ message: 'languages must be a non-empty array' });
    }

    // 2. The senior must have given consent.
    if (consent !== true) {
      return res.status(400).json({ message: 'Consent from the senior is required' });
    }

    // 3. A managed senior never logs in, so give them a unique placeholder email
    //    and a random password (the User model hashes it before saving).
    const email = `managed.${crypto.randomUUID()}@carebridge.local`;
    const password = crypto.randomBytes(16).toString('hex');

    // 4. Create the senior, linked to the logged-in family member.
    const senior = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'senior',
      languages,
      city,
      managedBy: req.user.id,
    });

    // 5. Return the new senior without the password (toJSON strips it).
    return res.status(201).json(senior.toJSON());
  } catch (error) {
    return next(error);
  }
};

// GET /api/family/seniors  (family only)
// Lists the senior profiles managed by the logged-in family member, newest first.
export const getManagedSeniors = async (req, res, next) => {
  try {
    const seniors = await User.find({ managedBy: req.user.id }).sort({ createdAt: -1 });

    return res.json(seniors);
  } catch (error) {
    return next(error);
  }
};
