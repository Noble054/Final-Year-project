const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const config = require('../config');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const generateToken = (user_id, role) => {
  return jwt.sign({ id: user_id, role }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, password, role, stationData } = req.body;
  const email = req.body.email.trim().toLowerCase();
  const phone_number = req.body.phone_number.replace(/[\s()-]/g, '');

  const userExists = db.prepare('SELECT * FROM Users WHERE name = ?').get(name);
  if (userExists) {
    throw new AppError('User already exists', 400);
  }
  const emailExists = db.prepare('SELECT user_id FROM Users WHERE email = ?').get(email);
  if (emailExists) throw new AppError('Email is already registered', 400);
  const phoneExists = db.prepare('SELECT user_id FROM Users WHERE phone_number = ?').get(phone_number);
  if (phoneExists) throw new AppError('Phone number is already registered', 400);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const insertTransaction = db.transaction(() => {
    const stmt = db.prepare('INSERT INTO Users (name, email, phone_number, password_hash, role, approval_status) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, phone_number, hashedPassword, role, 'pending');
    const userId = info.lastInsertRowid;

    if (role === 'Station Operator' && stationData) {
      const { stationName, lat, lng, contactNumber, services } = stationData;
      
      if (services?.charge) {
        const insertCharge = db.prepare(
          'INSERT INTO ChargingStations (operator_id, name, latitude, longitude, charger_type, total_slots, available_slots, price_per_kwh, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        insertCharge.run(userId, stationName || 'New Charging Station', lat || 0, lng || 0, 'Fast', 4, 4, 0.30, contactNumber || null);
      }

      if (services?.swap) {
        const insertSwap = db.prepare(
          'INSERT INTO BatterySwapStations (operator_id, name, latitude, longitude, battery_stock, contact_number) VALUES (?, ?, ?, ?, ?, ?)'
        );
        insertSwap.run(userId, stationName || 'New Battery Swap Station', lat || 0, lng || 0, 10, contactNumber || null);
      }
    }

    return userId;
  });

  const userId = insertTransaction();

  res.status(201).json({
    _id: userId,
    name,
    email,
    phone_number,
    role,
    approval_status: 'pending',
    message: 'Registration submitted for admin approval.',
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const user = db.prepare('SELECT * FROM Users WHERE name = ? OR LOWER(email) = ?').get(identifier.trim(), normalizedIdentifier);
  
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Invalid credentials', 400);
  }

  if (user.approval_status === 'pending') {
    throw new AppError('Your account is awaiting admin approval.', 403);
  }

  if (user.approval_status === 'rejected') {
    throw new AppError('Your account application was rejected.', 403);
  }

  res.json({
    _id: user.user_id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number,
    role: user.role,
    wallet_balance: user.wallet_balance,
    approval_status: user.approval_status,
    token: generateToken(user.user_id, user.role),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT user_id, name, email, phone_number, role, wallet_balance, approval_status, created_at FROM Users WHERE user_id = ?').get(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(user);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
