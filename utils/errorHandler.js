/**
 * Error Handler Utility
 * Centralized error handling and response formatting
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators
const errors = {
  // 400 Bad Request
  badRequest: (message = 'Bad Request', details = null) => 
    new AppError(message, 400, details),
  
  // 401 Unauthorized
  unauthorized: (message = 'Unauthorized') => 
    new AppError(message, 401),
  
  // 403 Forbidden
  forbidden: (message = 'Forbidden') => 
    new AppError(message, 403),
  
  // 404 Not Found
  notFound: (resource = 'Resource') => 
    new AppError(`${resource} not found`, 404),
  
  // 409 Conflict
  conflict: (message = 'Conflict') => 
    new AppError(message, 409),
  
  // 422 Unprocessable Entity
  unprocessable: (message = 'Invalid data', details = null) => 
    new AppError(message, 422, details),
  
  // 429 Too Many Requests
  tooManyRequests: (message = 'Too many requests. Please try again later') => 
    new AppError(message, 429),
  
  // 500 Internal Server Error
  internalError: (message = 'Internal Server Error') => 
    new AppError(message, 500),
  
  // Validation errors
  validation: (field, message) => 
    new AppError(`Validation error: ${message}`, 422, { field }),
  
  // Authentication errors
  invalidCredentials: () => 
    new AppError('Invalid email or password', 401),
  
  tokenExpired: () => 
    new AppError('Token expired. Please login again', 401),
  
  invalidToken: () => 
    new AppError('Invalid token. Please login again', 401),
  
  // Payment errors
  paymentError: (message = 'Payment processing failed') => 
    new AppError(message, 400),
  
  insufficientStock: (itemName, available) => 
    new AppError(`${itemName} - only ${available} available`, 400),
  
  // Order errors
  orderNotFound: () => 
    new AppError('Order not found', 404),
  
  invalidOrderStatus: (status) => 
    new AppError(`Invalid order status: ${status}`, 400),
};

// Format error response
const formatErrorResponse = (err, isDevelopment = false) => {
  const response = {
    success: false,
    message: err.message || 'Server Error',
    ...(err.details && { details: err.details })
  };

  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  return response;
};

// Safe async handler (catches async errors)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error formatter
const formatValidationErrors = (validationErrors) => {
  return validationErrors.map(err => ({
    field: err.param,
    message: err.msg
  }));
};

module.exports = {
  AppError,
  errors,
  formatErrorResponse,
  asyncHandler,
  formatValidationErrors
};
