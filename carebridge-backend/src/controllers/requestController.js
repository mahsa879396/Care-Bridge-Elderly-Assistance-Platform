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

// True when this user "owns" the request as the senior, or manages that senior
// as a family member. Used by complete / rate / cancel.
const ownsOrManages = async (request, user) => {
  // The senior who owns the request.
  if (request.senior.toString() === user.id) return true;

  // A family member who manages the request's senior.
  if (user.role === 'family') {
    const senior = await User.findById(request.senior).select('managedBy');
    if (senior && senior.managedBy && senior.managedBy.toString() === user.id) return true;
  }

  return false;
};

// POST /api/requests  (senior or family)
// A senior posts for themselves; a family member posts for a senior they manage.
export const createRequest = async (req, res, next) => {
  try {
    const { category, description, language, city, date, seniorId } = req.body;

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

    // 5. Decide whose request this is.
    //    - A senior posts for themselves.
    //    - A family member must name a senior they manage.
    let senior = req.user.id;
    if (req.user.role === 'family') {
      // The seniorId must be present, well-formed and managed by this family member.
      const managesSenior =
        seniorId &&
        mongoose.Types.ObjectId.isValid(seniorId) &&
        (await User.exists({ _id: seniorId, managedBy: req.user.id }));

      if (!managesSenior) {
        return res.status(403).json({ message: 'You do not manage this senior' });
      }

      senior = seniorId;
    }

    // 6. Create the request. "createdBy" is always the logged-in user.
    const request = await Request.create({
      senior,
      createdBy: req.user.id,
      category,
      description,
      language,
      city,
      date: requestDate,
    });

    // 7. Return the new request.
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
// Seniors see requests they created; volunteers see requests they accepted;
// family members see requests for any senior they manage.
export const getMyRequests = async (req, res, next) => {
  try {
    // 1. Pick the filter based on the user's role.
    let filter;
    if (req.user.role === 'volunteer') {
      filter = { volunteer: req.user.id };
    } else if (req.user.role === 'family') {
      // Collect the ids of every senior this family member manages.
      const managedSeniors = await User.find({ managedBy: req.user.id }).select('_id');
      filter = { senior: { $in: managedSeniors.map((senior) => senior._id) } };
    } else {
      filter = { senior: req.user.id };
    }

    // 2. Newest first.
    const requests = await Request.find(filter).sort({ createdAt: -1 });

    // 3. Attach the other people's names. Family members always see the senior's
    //    name, and the volunteer's name + phone only once the request is
    //    Accepted or Completed. Seniors and volunteers keep the old behaviour.
    for (const request of requests) {
      if (req.user.role === 'family') {
        const paths = [{ path: 'senior', select: 'firstName lastName' }];
        if (CONTACT_STATUSES.includes(request.status)) {
          paths.push({ path: 'volunteer', select: 'firstName lastName phone' });
        }
        await request.populate(paths);
      } else {
        const contactFields = CONTACT_STATUSES.includes(request.status)
          ? 'firstName lastName phone'
          : 'firstName lastName';

        await request.populate([
          { path: 'senior', select: contactFields },
          { path: 'volunteer', select: contactFields },
        ]);
      }
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

// PATCH /api/requests/:id/accept  (volunteer only)
// A verified volunteer accepts a request that is still waiting.
export const acceptRequest = async (req, res, next) => {
  try {
    // 1. The volunteer must be verified by an admin first.
    const volunteer = await User.findById(req.user.id);
    if (!volunteer || volunteer.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Your account is waiting for admin verification' });
    }

    // 2. The request must exist.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 3. Only a request that is still waiting can be accepted.
    if (request.status !== 'Pending') {
      return res.status(409).json({ message: 'Request already accepted' });
    }

    // 4. Accept it for the logged-in volunteer.
    request.status = 'Accepted';
    request.volunteer = req.user.id;
    await request.save();

    // 5. Return it with the senior's contact details.
    await request.populate('senior', 'firstName lastName phone');
    return res.json(request);
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/requests/:id/complete
// The request's senior (or managing family member) or its assigned volunteer marks it done.
export const completeRequest = async (req, res, next) => {
  try {
    // 1. The request must exist.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2. Allowed for the volunteer who accepted it, the senior who owns it,
    //    or the family member who manages that senior.
    const isVolunteer = request.volunteer && request.volunteer.toString() === req.user.id;
    const allowed = isVolunteer || (await ownsOrManages(request, req.user));
    if (!allowed) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 3. It can only be completed once it has been accepted.
    if (request.status !== 'Accepted') {
      return res.status(409).json({ message: 'Only accepted requests can be completed' });
    }

    // 4. Mark it as completed.
    request.status = 'Completed';
    await request.save();

    return res.json(request);
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/requests/:id/rate  (senior or family)
// The senior (or the family member managing them) rates the volunteer after completion.
export const rateRequest = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    // 1. The request must exist.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2. Only the senior who owns it (or the family member who manages them) can rate it.
    if (!(await ownsOrManages(request, req.user))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 3. It must be completed and not rated yet.
    if (request.status !== 'Completed' || request.rating !== null) {
      return res.status(409).json({ message: 'Request cannot be rated' });
    }

    // 4. The rating must be a whole number from 1 to 5.
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    // 5. The review is optional, but cannot be longer than 300 characters.
    if (review !== undefined && review !== null && typeof review !== 'string') {
      return res.status(400).json({ message: 'Review must be text' });
    }
    if (typeof review === 'string' && review.length > 300) {
      return res.status(400).json({ message: 'Review must be at most 300 characters' });
    }

    // 6. Save the rating (and the review, when one was sent).
    request.rating = rating;
    if (typeof review === 'string') request.review = review;
    await request.save();

    return res.json(request);
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/requests/:id  (senior or family)
// The senior (or the family member managing them) cancels a request that is not accepted yet.
export const cancelRequest = async (req, res, next) => {
  try {
    // 1. The request must exist.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2. Only the senior who owns it (or the family member who manages them) can cancel it.
    if (!(await ownsOrManages(request, req.user))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 3. Only requests that are still waiting can be cancelled.
    if (request.status !== 'Pending') {
      return res.status(409).json({ message: 'Only waiting requests can be cancelled' });
    }

    // 4. Delete the request.
    await request.deleteOne();

    return res.json({ message: 'Request cancelled' });
  } catch (error) {
    return next(error);
  }
};
