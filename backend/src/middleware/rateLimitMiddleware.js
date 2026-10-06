const rateLimit = require('express-rate-limit');
const config = require('../config');

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development if needed
  skip: (req) => {
    return config.nodeEnv === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  }
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return config.nodeEnv === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  }
});

// Stricter rate limiter for booking/reservation routes
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 bookings per hour
  message: {
    message: 'Too many booking attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return config.nodeEnv === 'development' && process.env.DISABLE_RATE_LIMIT === 'true';
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  bookingLimiter
};
