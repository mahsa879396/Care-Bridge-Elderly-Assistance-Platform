import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';

// Categories a request is allowed to use.
const CATEGORIES = ['grocery', 'mobility', 'companionship', 'other'];

// Statuses where the senior and volunteer are allowed to see each other's phone number.
const CONTACT_STATUSES = ['Accepted', 'Completed'];

// Turn user text into a safe piece of a regular expression
// (so special characters like "." or "(" are treated as normal text).
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/requests  (senior only)
// Creates a new help request for the logged-in senior.
export const createRequest = async (req, res, next) => {
  try {
    const { category, description, language, city, date } = req.body;

    // 1. Every field must be present.
    const requiredFields = { category, description, language, city, date };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // 2. The category must be one of the allowed values.
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // 3. The description cannot be longer than 500 characters.
    if (typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({ message: 'Description must be at most 500 characters' });
    }

    // 4. The date must be a valid date that is not in the past.
    const requestDate = new Date(date);
    if (Number.isNaN(requestDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    if (requestDate < new Date()) {
      return res.status(400).json({ message: 'Date cannot be in the past' });
    }

    // 5. Create the request. The logged-in senior is both the owner and the creator.
    const request = await Request.create({
      senior: req.user.id,
      createdBy: req.user.id,
      category,
      description,
      language,
      city,
      date: requestDate,
    });

    // 6. Return the new request.
    return res.status(201).json(request);
  } catch (error) {
    return next(error);
  }
};

// GET /api/requests  (volunteer only)
// Lists open ("Pending") requests so volunteers can find something to accept.
export const getRequests = async (req, res, next) => {
  try {
    // 1. Only verified volunteers may browse requests.
    const volunteer = await User.findById(req.user.id);
    if (!volunteer || volunteer.verificationStatus !== 'verified') {
      return res
        .status(403)
        .json({ message: 'Your account is waiting for admin verification' });
    }

    // 2. Only show requests that are still open.
    const filter = { status: 'Pending' };

    // 3. Optional filters from the query string (?city=&language=&category=).
    //    They can be combined. City matching ignores upper/lower case.
    const { city, language, category } = req.query;
    if (city) filter.city = new RegExp(`^${escapeRegExp(city)}$`, 'i');
    if (language) filter.language = language;
    if (category) filter.category = category;

    // 4. Newest first, and only the senior's first name is exposed.
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate('senior', 'firstName');

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
};

// GET /api/requests/mine
// Returns the requests that belong to the logged-in user.
// Seniors see requests they created; volunteers see requests they accepted.
export const getMyRequests = async (req, res, next) => {
  try {
    // 1. Pick the field to match on based on the user's role.
    const filter =
      req.user.role === 'volunteer' ? { volunteer: req.user.id } : { senior: req.user.id };

    // 2. Newest first.
    const requests = await Request.find(filter).sort({ createdAt: -1 });

    // 3. Attach the other person's name, and their phone number only once the
    //    request is Accepted or Completed (not while it is still Pending).
    for (const request of requests) {
      const contactFields = CONTACT_STATUSES.includes(request.status)
        ? 'firstName lastName phone'
        : 'firstName lastName';

      await request.populate([
        { path: 'senior', select: contactFields },
        { path: 'volunteer', select: contactFields },
      ]);
    }

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
};

// GET /api/requests/:id
// Returns one request. Only its senior, its volunteer, or a verified volunteer
// (while the request is still Pending) may see it.
export const getRequestById = async (req, res, next) => {
  try {
    // A malformed id can never match a real request, so treat it as not found.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Is the logged-in user the senior who owns it, or the assigned volunteer?
    const isSenior = request.senior.toString() === req.user.id;
    const isVolunteer = request.volunteer && request.volunteer.toString() === req.user.id;

    let allowed = isSenior || isVolunteer;

    // A verified volunteer may also look at a request that is still Pending.
    if (!allowed && req.user.role === 'volunteer' && request.status === 'Pending') {
      const volunteer = await User.findById(req.user.id);
      if (volunteer && volunteer.verificationStatus === 'verified') {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(request);
  } catch (error) {
    return next(error);
  }
};
