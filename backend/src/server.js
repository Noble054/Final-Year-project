const express = require('express');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const stationRoutes = require('./routes/stationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const batteryRoutes = require('./routes/batteryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const { generalLimiter, authLimiter, bookingLimiter } = require('./middleware/rateLimitMiddleware');
const { errorHandler, notFound } = require('./middleware/errorHandler');
require('./jobs/penaltyJob');
require('./init-db');
require('dotenv').config();

// Logger - initialize after dotenv
let logger;
try {
  logger = require('./config/logger');
} catch (error) {
  console.log('Logger initialization failed, using console fallback');
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api/', generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ChargeMate API', 
    status: 'running',
    version: '1.0.0'
  });
});

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/reservations', bookingLimiter, reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/battery', batteryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});
