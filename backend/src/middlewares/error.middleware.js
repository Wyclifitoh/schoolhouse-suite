const { error } = require('../utils/response');

const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled error:', err);

  if (err.isOperational) {
    return error(res, err.message, err.statusCode);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return error(res, message, statusCode);
};

module.exports = { errorHandler };
