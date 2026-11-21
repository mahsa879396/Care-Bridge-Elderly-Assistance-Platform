import mongoose from 'mongoose';
import User from '../models/User.js';
import Request from '../models/Request.js';

// Shared logic for /verify and /reject:
// load the user, make sure it is a volunteer, set the new status and return it.
const setVolunteerStatus = async (req, res, next, status) => {
  try {
    // An invalid id can never match a user, so treat it as not found.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only volunteers have a verification status.
    if (user.role !== 'volunteer') {
      return res.status(400).json({ message: 'User is not a volunteer' });
    }

    user.verificationStatus = status;
    await user.save();

    // toJSON removes the password before it is sent.
    return res.json(user.toJSON());
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/volunteers?status=pending|verified|rejected
// Lists volunteers, filtered by verification status (default: pending), newest first.
export const listVolunteers = async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';

    const volunteers = await User.find({ role: 'volunteer', verificationStatus: status }).sort({
      createdAt: -1,
    });

    return res.json(volunteers);
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/admin/volunteers/:id/verify
// Marks a volunteer as verified.
export const verifyVolunteer = (req, res, next) =>
  setVolunteerStatus(req, res, next, 'verified');

// PATCH /api/admin/volunteers/:id/reject
// Marks a volunteer as rejected.
export const rejectVolunteer = (req, res, next) =>
  setVolunteerStatus(req, res, next, 'rejected');

// GET /api/admin/users?role=senior|family|volunteer
// Lists users, optionally filtered by role, newest first.
export const listUsers = async (req, res, next) => {
  try {
    // Build the filter, adding the role only when it was provided.
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/requests?status=Pending|Accepted|Completed
// Lists all help requests, optionally filtered by status, newest first.
export const listRequests = async (req, res, next) => {
  try {
    // Build the filter, adding the status only when it was provided.
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    // Replace the stored ids with the people's name and phone number.
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate('senior', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName phone')
      .populate('volunteer', 'firstName lastName phone');

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/stats
// Small dashboard numbers: user counts and request counts by status.
export const getStats = async (req, res, next) => {
  try {
    // Run all the counts at the same time for speed.
    const [
      seniors,
      families,
      volunteers,
      pendingVolunteers,
      openRequests,
      acceptedRequests,
      completedRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'senior' }),
      User.countDocuments({ role: 'family' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'volunteer', verificationStatus: 'pending' }),
      Request.countDocuments({ status: 'Pending' }),
      Request.countDocuments({ status: 'Accepted' }),
      Request.countDocuments({ status: 'Completed' }),
    ]);

    return res.json({
      seniors,
      families,
      volunteers,
      pendingVolunteers,
      openRequests,
      acceptedRequests,
      completedRequests,
    });
  } catch (error) {
    return next(error);
  }
};
