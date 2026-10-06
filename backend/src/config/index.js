require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'chargemate_db',
    user: process.env.DB_USER || 'chargemate',
    password: process.env.DB_PASSWORD || 'password',
    path: process.env.DB_PATH || './chargemate.db',
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Payment Configuration
  payment: {
    reservationDeposit: parseFloat(process.env.RESERVATION_DEPOSIT) || 10.00,
    sessionCompletionFee: parseFloat(process.env.SESSION_COMPLETION_FEE) || 5.00,
    batterySwapFee: parseFloat(process.env.BATTERY_SWAP_FEE) || 15.00,
    penaltyAmount: parseFloat(process.env.PENALTY_AMOUNT) || 1.00,
    penaltyTimeWindowMinutes: parseInt(process.env.PENALTY_TIME_WINDOW_MINUTES) || 30,
  },
  
  // Cron Jobs
  penaltyJobCron: process.env.PENALTY_JOB_CRON || '* * * * *',
  
  // Validation
  validation: {
    nameMinLength: 3,
    nameMaxLength: 50,
    passwordMinLength: 8,
    passwordMaxLength: 100,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

module.exports = config;
