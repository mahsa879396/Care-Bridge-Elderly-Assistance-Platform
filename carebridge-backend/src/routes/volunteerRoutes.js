import { Router } from 'express';
import mongoose from 'mongoose';
import Request from '../models/Request.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/volunteers/:id/rating
// Returns the volunteer's average rating (rounded to 1 decimal) and how many
// ratings it is based on. Completed requests without a rating are ignored.
router.get('/:id/rating', protect, async (req, res, next) => {
  try {
    // An unknown/invalid id has no ratings at all.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({ average: null, count: 0 });
    }

    // Only look at this volunteer's completed requests that have a rating.
    const ratedRequests = await Request.find({
      volunteer: req.params.id,
      status: 'Completed',
      rating: { $ne: null },
    });

    const count = ratedRequests.length;

    // No ratings yet -> average is null.
    if (count === 0) {
      return res.json({ average: null, count: 0 });
    }

    // Add up the ratings and divide by the number of ratings,
    // then round to 1 decimal place (e.g. 4.6666 -> 4.7).
    const sum = ratedRequests.reduce((total, request) => total + request.rating, 0);
    const average = Math.round((sum / count) * 10) / 10;

    return res.json({ average, count });
  } catch (error) {
    return next(error);
  }
});

export default router;
