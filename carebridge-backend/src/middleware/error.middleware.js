// Runs when no route matched the request, and forwards a 404 error.
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

// Central error handler: converts errors into a consistent JSON response.
// Express treats a function with 4 arguments as an error handler,
// so `next` must stay in the signature even though it is unused here.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Default to 500 unless a specific status code was set earlier.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    status: 'error',
    message: err.message,
  });
};
