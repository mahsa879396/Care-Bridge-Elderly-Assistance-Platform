import jwt from 'jsonwebtoken';

// protect: makes sure the request carries a valid "Authorization: Bearer <token>" header.
// When the token is valid we store { id, role } on req.user so the route can use it.
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // The header must exist and start with "Bearer ".
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  // The token is the part after "Bearer ".
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token with the same secret used to sign it.
    // jwt.verify throws when the token is invalid or expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Keep only the fields we need from the token payload.
    req.user = { id: decoded.id, role: decoded.role };

    return next();
  } catch (error) {
    // Invalid or expired token -> same 401 as a missing header.
    return res.status(401).json({ message: 'Not authorized' });
  }
};

// requireRole: use it after protect to allow only certain roles.
// Example: router.get('/admin', protect, requireRole('admin'), handler)
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    // req.user is set by protect; if the role is not allowed, return 403.
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
