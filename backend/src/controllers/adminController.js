const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getOverview = asyncHandler(async (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
  const stationCount = db.prepare('SELECT COUNT(*) as count FROM ChargingStations').get().count;
  const swapCount = db.prepare('SELECT COUNT(*) as count FROM BatterySwapStations').get().count;
  const recentTransactions = db.prepare(`
    SELECT Transactions.*, Users.name AS user_name, Users.email AS user_email, Users.role AS user_role
    FROM Transactions
    LEFT JOIN Users ON Users.user_id = Transactions.user_id
    ORDER BY Transactions.created_at DESC
    LIMIT 10
  `).all();
  const recentUsers = db.prepare('SELECT user_id, name, email, role, created_at FROM Users ORDER BY created_at DESC LIMIT 10').all();

  // Battery Diagnostics
  const batteryCount = db.prepare('SELECT COUNT(*) as count FROM Batteries').get().count;
  const avgHealthRow = db.prepare('SELECT AVG(health_status) as avgHealth FROM Batteries').get();
  const avgHealth = avgHealthRow.avgHealth !== null ? Math.round(avgHealthRow.avgHealth) : 0;
  
  const statusBreakdown = db.prepare('SELECT status, COUNT(*) as count FROM Batteries GROUP BY status').all();
  const lowHealthBatteries = db.prepare('SELECT * FROM Batteries WHERE health_status < 80 ORDER BY health_status ASC LIMIT 10').all();

  res.json({
    userCount,
    stationCount,
    swapCount,
    recentTransactions,
    recentUsers,
    batteryDiagnostics: {
      batteryCount,
      avgHealth,
      statusBreakdown,
      lowHealthBatteries
    }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  let query = 'SELECT user_id, name, email, phone_number, role, wallet_balance, approval_status, created_at FROM Users WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (role && role !== 'all') {
    query += ' AND role = ?';
    params.push(role);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const users = db.prepare(query).all(...params);
  res.json(users);
});

const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = db.prepare('SELECT * FROM SubscriptionPlans ORDER BY monthly_price ASC').all();
  res.json(plans);
});

const getNetworkHealth = asyncHandler(async (req, res) => {
  const chargingStations = db.prepare(`
    SELECT station_id AS id, name, 'Charging' AS station_type, status, total_slots AS capacity,
           available_slots AS available, operator_id
    FROM ChargingStations
    ORDER BY name ASC
  `).all();
  const swapStations = db.prepare(`
    SELECT swap_id AS id, name, 'Battery Swap' AS station_type, status, battery_stock AS capacity,
           battery_stock AS available, operator_id
    FROM BatterySwapStations
    ORDER BY name ASC
  `).all();
  const stations = [...chargingStations, ...swapStations].map((station) => ({
    ...station,
    utilization: station.capacity > 0 ? Math.round(((station.capacity - station.available) / station.capacity) * 100) : 0,
  }));

  res.json({
    stations,
    summary: {
      total: stations.length,
      online: stations.filter((station) => station.status === 'active').length,
      heavyLoad: stations.filter((station) => station.status === 'active' && station.capacity > 0 && station.available / station.capacity <= 0.25).length,
      offline: stations.filter((station) => station.status !== 'active').length,
    },
  });
});

const getSystemSettings = asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT setting_key, setting_value FROM SystemSettings ORDER BY setting_key').all();
  const settings = rows.reduce((result, row) => {
    result[row.setting_key] = Number(row.setting_value);
    return result;
  }, {});
  res.json(settings);
});

const updateSystemSettings = asyncHandler(async (req, res) => {
  const allowedSettings = ['reservationDeposit', 'sessionCompletionFee', 'batterySwapFee', 'penaltyAmount', 'penaltyTimeWindowMinutes'];
  const updates = Object.entries(req.body);

  if (updates.some(([key, value]) => !allowedSettings.includes(key) || value === '' || Number.isNaN(Number(value)) || Number(value) < 0)) {
    throw new AppError('Invalid system settings values', 400);
  }

  const updateSetting = db.prepare('UPDATE SystemSettings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?');
  const saveSettings = db.transaction(() => {
    for (const [key, value] of updates) {
      updateSetting.run(String(Number(value)), key);
    }
  });
  saveSettings();

  const rows = db.prepare('SELECT setting_key, setting_value FROM SystemSettings ORDER BY setting_key').all();
  res.json(rows.reduce((result, row) => {
    result[row.setting_key] = Number(row.setting_value);
    return result;
  }, {}));
});

const updateSubscriptionPlan = asyncHandler(async (req, res) => {
  const { plan_id } = req.params;
  const { monthly_price, booking_discount, swap_discount, monthly_bookings, active } = req.body;

  const values = [monthly_price, booking_discount, swap_discount, monthly_bookings, active];
  if (values.some((value) => value === undefined || value === null || Number.isNaN(Number(value)))) {
    throw new AppError('All subscription plan values are required', 400);
  }
  if (Number(monthly_price) < 0 || Number(booking_discount) < 0 || Number(booking_discount) > 100 || Number(swap_discount) < 0 || Number(swap_discount) > 100 || Number(monthly_bookings) < 0 || ![0, 1].includes(Number(active))) {
    throw new AppError('Invalid subscription plan values', 400);
  }

  const result = db.prepare(`
    UPDATE SubscriptionPlans
    SET monthly_price = ?, booking_discount = ?, swap_discount = ?, monthly_bookings = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE plan_id = ?
  `).run(Number(monthly_price), Number(booking_discount), Number(swap_discount), Number(monthly_bookings), Number(active), plan_id);

  if (result.changes === 0) {
    throw new AppError('Subscription plan not found', 404);
  }

  res.json(db.prepare('SELECT * FROM SubscriptionPlans WHERE plan_id = ?').get(plan_id));
});

const updateUserApprovalStatus = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const { approval_status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(approval_status)) {
    throw new AppError('Invalid approval status', 400);
  }

  const targetUser = db.prepare('SELECT user_id, name, approval_status FROM Users WHERE user_id = ?').get(user_id);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  if (targetUser.approval_status === 'approved') {
    throw new AppError('Approved users cannot be approved or rejected again', 400);
  }

  db.prepare('UPDATE Users SET approval_status = ? WHERE user_id = ?').run(approval_status, user_id);

  res.json({
    message: `User ${targetUser.name} ${approval_status} successfully`,
    user_id: Number(user_id),
    approval_status,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  
  const user = db.prepare('SELECT user_id, name FROM Users WHERE user_id = ?').get(user_id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  if (Number(user_id) === req.user.id) {
    throw new AppError('You cannot delete your own admin account', 400);
  }
  
  db.prepare('DELETE FROM Users WHERE user_id = ?').run(user_id);
  
  res.json({ message: `User ${user.name} deleted successfully` });
});

module.exports = {
  getOverview,
  getUsers,
  getSubscriptionPlans,
  getNetworkHealth,
  getSystemSettings,
  updateSystemSettings,
  updateSubscriptionPlan,
  updateUserApprovalStatus,
  deleteUser
};
