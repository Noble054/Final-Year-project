const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../config/db');
const { AppError } = require('./errorHandler');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = db.prepare('SELECT approval_status FROM Users WHERE user_id = ?').get(decoded.id);
      if (!user || user.approval_status !== 'approved') {
        throw new AppError('Your account is not approved', 403);
      }
      req.user = decoded;
      return next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Not authorized, token failed', 401);
    }
  }

  if (!token) {
    throw new AppError('Not authorized, no token', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(`User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
