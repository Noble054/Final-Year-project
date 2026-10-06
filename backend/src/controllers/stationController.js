const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getChargingStations = asyncHandler(async (req, res) => {
  const stations = db.prepare('SELECT * FROM ChargingStations WHERE status = ?').all('active');
  res.json(stations);
});

const getBatterySwapStations = asyncHandler(async (req, res) => {
  const stations = db.prepare('SELECT * FROM BatterySwapStations WHERE status = ?').all('active');
  res.json(stations);
});

const getMyStations = asyncHandler(async (req, res) => {
  const chargingStations = db.prepare('SELECT * FROM ChargingStations WHERE operator_id = ?').all(req.user.id);
  const swapStations = db.prepare('SELECT * FROM BatterySwapStations WHERE operator_id = ?').all(req.user.id);
  res.json({ chargingStations, swapStations });
});

const createStation = asyncHandler(async (req, res) => {
  // Accept frontend-friendly payload: { name, type: 'charging'|'swap', latitude, longitude, slots, price, contact_number }
  const { name, type, latitude, longitude, slots, price, contact_number } = req.body;

  if (type === 'charging') {
    // Map frontend fields to ChargingStations schema
    const charger_type = 'Fast';
    const total_slots = parseInt(slots, 10) || 1;
    const available_slots = total_slots;
    const price_per_kwh = price !== undefined ? parseFloat(price) : 0.0;

    const stmt = db.prepare('INSERT INTO ChargingStations (operator_id, name, latitude, longitude, charger_type, total_slots, available_slots, price_per_kwh, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(req.user.id, name, latitude, longitude, charger_type, total_slots, available_slots, price_per_kwh, contact_number || null);

    res.status(201).json({ message: 'Charging station created successfully' });
    return;
  }

  if (type === 'swap') {
    const battery_stock = parseInt(slots, 10) || 0;
    const stmt = db.prepare('INSERT INTO BatterySwapStations (operator_id, name, latitude, longitude, battery_stock, contact_number) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(req.user.id, name, latitude, longitude, battery_stock, contact_number || null);

    res.status(201).json({ message: 'Battery swap station created successfully' });
    return;
  }

  throw new AppError('Invalid station type', 400);
});

const seedStations = asyncHandler(async (req, res) => {
  // Check if operator exists, if not create one
  let operator = db.prepare("SELECT user_id FROM Users WHERE role = 'Station Operator' LIMIT 1").get();
  let opId;
  if (!operator) {
    const info = db.prepare("INSERT INTO Users (name, email, password_hash, role) VALUES ('Mock Op', 'op@mock.com', 'hashed', 'Station Operator')").run();
    opId = info.lastInsertRowid;
  } else {
    opId = operator.user_id;
  }

  // Seed Charging Stations
  db.prepare(`INSERT INTO ChargingStations (operator_id, name, latitude, longitude, charger_type, total_slots, available_slots, price_per_kwh) VALUES 
    (?, 'Accra Mall Fast Charge', 5.6231, -0.1731, 'DC Fast', 12, 10, 2.50),
    (?, 'Kumasi Central Hub', 6.6906, -1.6286, 'Level 2', 8, 4, 1.80),
    (?, 'Takoradi Port Charge', 4.8950, -1.7450, 'Level 2', 6, 2, 1.50)
  `).run(opId, opId, opId);

  // Seed Battery Swap
  db.prepare(`INSERT INTO BatterySwapStations (operator_id, name, latitude, longitude, battery_stock) VALUES 
    (?, 'Greater Accra Swap Hub', 5.6037, -0.1870, 45),
    (?, 'Kumasi Swap Station', 6.6666, -1.6163, 20)
  `).run(opId, opId);

  res.json({ message: 'Database seeded with Ghana-based stations' });
});

const getStationById = asyncHandler(async (req, res) => {
  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ?').get(req.params.id);
  if (!station) {
    throw new AppError('Station not found', 404);
  }

  const activeReservations = db.prepare(`
    SELECT slot_time
    FROM Reservations
    WHERE station_id = ? AND status IN ('pending', 'confirmed')
    ORDER BY datetime(slot_time) ASC
  `).all(req.params.id);
  const utilization = station.total_slots > 0
    ? Math.round(((station.total_slots - station.available_slots) / station.total_slots) * 100)
    : 0;
  const earliestSlot = activeReservations[0]?.slot_time;
  const estimatedAvailableAt = earliestSlot
    ? new Date(Math.max(Date.now(), new Date(earliestSlot).getTime()) + 45 * 60 * 1000).toISOString()
    : null;

  res.json({
    ...station,
    congestion: {
      isFull: station.available_slots <= 0,
      isHighlyCongested: utilization >= 75,
      utilization,
      activeReservations: activeReservations.length,
      estimatedAvailableAt,
      estimatedSessionMinutes: 45,
    },
  });
});

const getSwapStationById = asyncHandler(async (req, res) => {
  const station = db.prepare('SELECT * FROM BatterySwapStations WHERE swap_id = ?').get(req.params.id);
  if (!station) {
    throw new AppError('Swap station not found', 404);
  }
  res.json(station);
});

const getSwapStationBatteries = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batteries = db.prepare('SELECT * FROM Batteries WHERE swap_id = ? ORDER BY created_at DESC').all(id);
  res.json(batteries);
});

const getDriverActiveBattery = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const battery = db.prepare('SELECT * FROM Batteries WHERE user_id = ? AND status = ?').get(user_id, 'swapped');
  res.json(battery || null);
});

const registerBattery = asyncHandler(async (req, res) => {
  const { id } = req.params; // swap_id
  const { serial_number, battery_type, charge_level, health_status, status, bike_type, bike_model } = req.body;

  if (!serial_number) {
    throw new AppError('Serial number is required', 400);
  }

  // Validate swap station exists
  const station = db.prepare('SELECT * FROM BatterySwapStations WHERE swap_id = ?').get(id);
  if (!station) {
    throw new AppError('Battery swap station not found', 404);
  }

  const existing = db.prepare('SELECT * FROM Batteries WHERE serial_number = ?').get(serial_number);
  if (existing) {
    throw new AppError('Battery with this serial number already exists', 400);
  }

  try {
    const insert = db.prepare(
      'INSERT INTO Batteries (swap_id, serial_number, battery_type, charge_level, health_status, status, bike_type, bike_model) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const info = insert.run(
      id,
      serial_number,
      battery_type || 'Lithium-Ion',
      charge_level !== undefined ? charge_level : 100,
      health_status !== undefined ? health_status : 100,
      status || 'available',
      bike_type || null,
      bike_model || null
    );

    const availableCount = db.prepare(
      'SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?'
    ).get(id, 'available').count;
    db.prepare('UPDATE BatterySwapStations SET battery_stock = ? WHERE swap_id = ?').run(availableCount, id);

    res.status(201).json({
      message: 'Battery registered successfully',
      battery_id: info.lastInsertRowid
    });
  } catch (error) {
    console.error('Battery registration error:', error);
    throw new AppError('Failed to register battery: ' + error.message, 500);
  }
});

const updateBattery = asyncHandler(async (req, res) => {
  const { battery_id } = req.params;
  const { charge_level, health_status, status, swap_id } = req.body;

  const battery = db.prepare('SELECT * FROM Batteries WHERE battery_id = ?').get(battery_id);
  if (!battery) {
    throw new AppError('Battery not found', 404);
  }

  const updates = [];
  const params = [];

  if (charge_level !== undefined) {
    updates.push('charge_level = ?');
    params.push(charge_level);
  }
  if (health_status !== undefined) {
    updates.push('health_status = ?');
    params.push(health_status);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (swap_id !== undefined) {
    updates.push('swap_id = ?');
    params.push(swap_id);
  }

  if (updates.length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  params.push(battery_id);
  db.prepare(`UPDATE Batteries SET ${updates.join(', ')} WHERE battery_id = ?`).run(...params);

  const stationsToUpdate = new Set();
  if (battery.swap_id) stationsToUpdate.add(battery.swap_id);
  if (swap_id) stationsToUpdate.add(swap_id);

  for (const stId of stationsToUpdate) {
    const availableCount = db.prepare(
      'SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?'
    ).get(stId, 'available').count;
    db.prepare('UPDATE BatterySwapStations SET battery_stock = ? WHERE swap_id = ?').run(availableCount, stId);
  }

  res.json({ message: 'Battery updated successfully' });
});

const simulateBatteryCharging = asyncHandler(async (req, res) => {
  const chargingBatteries = db.prepare("SELECT * FROM Batteries WHERE status = 'charging'").all();
  const updateStmt = db.prepare('UPDATE Batteries SET charge_level = ?, status = ? WHERE battery_id = ?');
  const stationsToUpdate = new Set();
  const results = [];

  const runTx = db.transaction(() => {
    for (const batt of chargingBatteries) {
      let newCharge = Math.min(100, batt.charge_level + 10);
      let newStatus = batt.status;
      if (newCharge >= 95) {
        newStatus = 'available';
        if (batt.swap_id) {
          stationsToUpdate.add(batt.swap_id);
        }
      }
      updateStmt.run(newCharge, newStatus, batt.battery_id);
      results.push({
        battery_id: batt.battery_id,
        serial_number: batt.serial_number,
        old_charge: batt.charge_level,
        new_charge: newCharge,
        new_status: newStatus
      });
    }

    for (const stId of stationsToUpdate) {
      const availableCount = db.prepare(
        'SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?'
      ).get(stId, 'available').count;
      db.prepare('UPDATE BatterySwapStations SET battery_stock = ? WHERE swap_id = ?').run(availableCount, stId);
    }
  });

  runTx();

  res.json({
    message: 'Simulation charge step completed',
    updated_batteries: results
  });
});

const simulateBatteryDepletion = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { depletion_amount = 10 } = req.body;

  const activeBattery = db.prepare('SELECT * FROM Batteries WHERE user_id = ? AND status = ?').get(user_id, 'swapped');
  if (!activeBattery) {
    throw new AppError('No active battery found', 404);
  }

  const newChargeLevel = Math.max(0, activeBattery.charge_level - depletion_amount);
  
  db.prepare('UPDATE Batteries SET charge_level = ? WHERE battery_id = ?').run(newChargeLevel, activeBattery.battery_id);

  res.json({
    message: 'Battery depletion simulated',
    battery_id: activeBattery.battery_id,
    serial_number: activeBattery.serial_number,
    old_charge: activeBattery.charge_level,
    new_charge: newChargeLevel,
    can_swap: newChargeLevel <= 30
  });
});

// Station Profile Management
const updateStationProfile = asyncHandler(async (req, res) => {
  const { station_id } = req.params;
  const { name, contact_number, operating_hours, status } = req.body;

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  // Validate status if provided
  if (status !== undefined) {
    const validStatuses = ['active', 'inactive', 'maintenance', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status value. Must be one of: active, inactive, maintenance, closed', 400);
    }
  }

  const updates = [];
  const params = [];

  if (name !== undefined && name !== '') {
    updates.push('name = ?');
    params.push(name);
  }
  if (contact_number !== undefined) {
    updates.push('contact_number = ?');
    params.push(contact_number || null);
  }
  if (operating_hours !== undefined) {
    updates.push('operating_hours = ?');
    params.push(operating_hours || null);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length > 0) {
    params.push(station_id);
    try {
      db.prepare(`UPDATE ChargingStations SET ${updates.join(', ')} WHERE station_id = ?`).run(...params);
    } catch (error) {
      console.error('Database update error:', error);
      throw new AppError('Failed to update station: ' + error.message, 500);
    }
  }

  res.json({ message: 'Station profile updated successfully' });
});

const updateSwapStationProfile = asyncHandler(async (req, res) => {
  const { swap_id } = req.params;
  const { name, contact_number, operating_hours, status } = req.body;

  const station = db.prepare('SELECT * FROM BatterySwapStations WHERE swap_id = ? AND operator_id = ?').get(swap_id, req.user.id);
  if (!station) {
    throw new AppError('Swap station not found or unauthorized', 404);
  }

  // Validate status if provided
  if (status !== undefined) {
    const validStatuses = ['active', 'inactive', 'maintenance', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status value. Must be one of: active, inactive, maintenance, closed', 400);
    }
  }

  const updates = [];
  const params = [];

  if (name !== undefined && name !== '') {
    updates.push('name = ?');
    params.push(name);
  }
  if (contact_number !== undefined) {
    updates.push('contact_number = ?');
    params.push(contact_number || null);
  }
  if (operating_hours !== undefined) {
    updates.push('operating_hours = ?');
    params.push(operating_hours || null);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length > 0) {
    params.push(swap_id);
    try {
      db.prepare(`UPDATE BatterySwapStations SET ${updates.join(', ')} WHERE swap_id = ?`).run(...params);
    } catch (error) {
      console.error('Database update error:', error);
      throw new AppError('Failed to update swap station: ' + error.message, 500);
    }
  }

  res.json({ message: 'Swap station profile updated successfully' });
});

// Charging Slot Management
const updateSlotAvailability = asyncHandler(async (req, res) => {
  const { station_id } = req.params;
  const { available_slots } = req.body;

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  if (available_slots < 0 || available_slots > station.total_slots) {
    throw new AppError('Invalid slot count', 400);
  }

  db.prepare('UPDATE ChargingStations SET available_slots = ? WHERE station_id = ?').run(available_slots, station_id);

  res.json({ message: 'Slot availability updated successfully' });
});

const getSlotStats = asyncHandler(async (req, res) => {
  const { station_id } = req.params;

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  const occupiedSlots = station.total_slots - station.available_slots;
  const utilizationRate = station.total_slots > 0 ? ((occupiedSlots / station.total_slots) * 100).toFixed(1) : 0;

  res.json({
    total_slots: station.total_slots,
    available_slots: station.available_slots,
    occupied_slots: occupiedSlots,
    utilization_rate: parseFloat(utilizationRate)
  });
});

// Battery Swap Management
const getSwapRequests = asyncHandler(async (req, res) => {
  const { swap_id } = req.params;

  const station = db.prepare('SELECT * FROM BatterySwapStations WHERE swap_id = ? AND operator_id = ?').get(swap_id, req.user.id);
  if (!station) {
    throw new AppError('Swap station not found or unauthorized', 404);
  }

  // Get recent swap logs for this station
  const swapLogs = db.prepare(`
    SELECT sl.*, u.name as user_name, u.email as user_email,
           b_out.serial_number as battery_out_serial, b_in.serial_number as battery_in_serial
    FROM SwapLogs sl
    LEFT JOIN Users u ON sl.user_id = u.user_id
    LEFT JOIN Batteries b_out ON sl.battery_out_id = b_out.battery_id
    LEFT JOIN Batteries b_in ON sl.battery_in_id = b_in.battery_id
    WHERE sl.swap_id = ?
    ORDER BY sl.swapped_at DESC
    LIMIT 20
  `).all(swap_id);

  res.json(swapLogs);
});

const processSwapRequest = asyncHandler(async (req, res) => {
  const { swap_id } = req.params;
  const { user_id, battery_out_id, battery_in_id, charge_level_out, charge_level_in, cost } = req.body;

  const station = db.prepare('SELECT * FROM BatterySwapStations WHERE swap_id = ? AND operator_id = ?').get(swap_id, req.user.id);
  if (!station) {
    throw new AppError('Swap station not found or unauthorized', 404);
  }

  // Verify batteries exist and are available
  const batteryOut = db.prepare('SELECT * FROM Batteries WHERE battery_id = ? AND user_id = ?').get(battery_out_id, user_id);
  const batteryIn = db.prepare('SELECT * FROM Batteries WHERE battery_id = ? AND swap_id = ? AND status = ?').get(battery_in_id, swap_id, 'available');

  if (!batteryOut) {
    throw new AppError('Battery to swap out not found or not owned by user', 400);
  }
  if (!batteryIn) {
    throw new AppError('Battery to swap in not found or not available', 400);
  }

  // Process the swap
  const insertLog = db.prepare(`
    INSERT INTO SwapLogs (swap_id, user_id, battery_out_id, battery_in_id, charge_level_out, charge_level_in, cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const logInfo = insertLog.run(swap_id, user_id, battery_out_id, battery_in_id, charge_level_out, charge_level_in, cost);

  // Update battery statuses
  db.prepare('UPDATE Batteries SET user_id = NULL, swap_id = ?, status = ? WHERE battery_id = ?').run(swap_id, 'available', battery_out_id);
  db.prepare('UPDATE Batteries SET user_id = ?, swap_id = NULL, status = ? WHERE battery_id = ?').run(user_id, 'swapped', battery_in_id);

  res.status(201).json({
    message: 'Battery swap processed successfully',
    swap_log_id: logInfo.lastInsertRowid
  });
});

// Charging Reservation Management
const getStationReservations = asyncHandler(async (req, res) => {
  const { station_id } = req.params;

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  const reservations = db.prepare(`
    SELECT r.*, u.name as user_name, u.email as user_email
    FROM Reservations r
    LEFT JOIN Users u ON r.user_id = u.user_id
    WHERE r.station_id = ?
    ORDER BY r.slot_time DESC
  `).all(station_id);

  res.json(reservations);
});

const updateReservationStatus = asyncHandler(async (req, res) => {
  const { reservation_id } = req.params;
  const { status } = req.body;

  const reservation = db.prepare(`
    SELECT r.*, cs.operator_id
    FROM Reservations r
    JOIN ChargingStations cs ON r.station_id = cs.station_id
    WHERE r.reservation_id = ?
  `).get(reservation_id);

  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }
  if (reservation.operator_id !== req.user.id) {
    throw new AppError('Unauthorized to modify this reservation', 403);
  }

  const validStatuses = ['pending', 'confirmed', 'missed', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  db.prepare('UPDATE Reservations SET status = ? WHERE reservation_id = ?').run(status, reservation_id);

  // If completing a reservation, update available slots
  if (status === 'completed' || status === 'missed') {
    db.prepare('UPDATE ChargingStations SET available_slots = available_slots + 1 WHERE station_id = ?').run(reservation.station_id);
  }

  res.json({ message: 'Reservation status updated successfully' });
});

// Transaction Management
const getStationTransactions = asyncHandler(async (req, res) => {
  const { station_id } = req.params;
  const { type } = req.query; // 'charging' or 'swap' or 'all'

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  let transactions;
  if (type === 'swap') {
    // Get swap logs as transactions
    transactions = db.prepare(`
      SELECT sl.*, u.name as user_name, 'swap' as type
      FROM SwapLogs sl
      LEFT JOIN Users u ON sl.user_id = u.user_id
      WHERE sl.swap_id IN (
        SELECT swap_id FROM BatterySwapStations WHERE operator_id = ?
      )
      ORDER BY sl.swapped_at DESC
      LIMIT 50
    `).all(req.user.id);
  } else {
    // Get regular transactions
    transactions = db.prepare(`
      SELECT t.*, u.name as user_name
      FROM Transactions t
      LEFT JOIN Users u ON t.user_id = u.user_id
      WHERE t.user_id IN (
        SELECT user_id FROM Reservations WHERE station_id = ?
      )
      ORDER BY t.created_at DESC
      LIMIT 50
    `).all(station_id);
  }

  res.json(transactions);
});

// Station Activity Monitoring
const getStationActivity = asyncHandler(async (req, res) => {
  const { station_id } = req.params;

  const station = db.prepare('SELECT * FROM ChargingStations WHERE station_id = ? AND operator_id = ?').get(station_id, req.user.id);
  if (!station) {
    throw new AppError('Station not found or unauthorized', 404);
  }

  // Get current activity metrics
  const activeReservations = db.prepare(`
    SELECT COUNT(*) as count FROM Reservations 
    WHERE station_id = ? AND status IN ('confirmed', 'pending')
  `).get(station_id).count;

  const todaySessions = db.prepare(`
    SELECT COUNT(*) as count FROM Reservations 
    WHERE station_id = ? AND DATE(created_at) = DATE('now')
  `).get(station_id).count;

  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(t.amount), 0) as total FROM Transactions t
    JOIN Reservations r ON t.user_id = r.user_id
    WHERE r.station_id = ? AND DATE(t.created_at) = DATE('now')
  `).get(station_id).total;

  // Get swap station activity if exists
  const swapStation = db.prepare('SELECT * FROM BatterySwapStations WHERE operator_id = ?').get(req.user.id);
  let swapActivity = null;
  
  if (swapStation) {
    const availableBatteries = db.prepare('SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?').get(swapStation.swap_id, 'available').count;
    const chargingBatteries = db.prepare('SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?').get(swapStation.swap_id, 'charging').count;
    const todaySwaps = db.prepare(`
      SELECT COUNT(*) as count FROM SwapLogs 
      WHERE swap_id = ? AND DATE(swapped_at) = DATE('now')
    `).get(swapStation.swap_id).count;

    swapActivity = {
      available_batteries: availableBatteries,
      charging_batteries: chargingBatteries,
      today_swaps: todaySwaps,
      total_batteries: availableBatteries + chargingBatteries
    };
  }

  const utilizationRate = station.total_slots > 0 
    ? (((station.total_slots - station.available_slots) / station.total_slots) * 100).toFixed(1) 
    : 0;

  res.json({
    charging_station: {
      station_id: station.station_id,
      name: station.name,
      total_slots: station.total_slots,
      available_slots: station.available_slots,
      occupied_slots: station.total_slots - station.available_slots,
      utilization_rate: parseFloat(utilizationRate),
      active_reservations: activeReservations,
      today_sessions: todaySessions,
      today_revenue: parseFloat(todayRevenue)
    },
    swap_station: swapActivity
  });
});

const getOperatorAnalytics = asyncHandler(async (req, res) => {
  const operator_id = req.user.id;

  // Get all stations
  const chargingStations = db.prepare('SELECT * FROM ChargingStations WHERE operator_id = ?').all(operator_id);
  const swapStations = db.prepare('SELECT * FROM BatterySwapStations WHERE operator_id = ?').all(operator_id);

  // Calculate overall metrics
  const totalSlots = chargingStations.reduce((sum, s) => sum + s.total_slots, 0);
  const totalAvailable = chargingStations.reduce((sum, s) => sum + s.available_slots, 0);
  const totalOccupied = totalSlots - totalAvailable;

  // Get today's revenue
  const todayRevenue = db.prepare(`
    SELECT COALESCE(SUM(t.amount), 0) as total FROM Transactions t
    WHERE t.user_id IN (
      SELECT r.user_id FROM Reservations r
      JOIN ChargingStations cs ON r.station_id = cs.station_id
      WHERE cs.operator_id = ?
    ) AND DATE(t.created_at) = DATE('now')
  `).get(operator_id).total;

  // Get swap revenue
  const swapRevenue = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as total FROM SwapLogs sl
    JOIN BatterySwapStations bss ON sl.swap_id = bss.swap_id
    WHERE bss.operator_id = ? AND DATE(sl.swapped_at) = DATE('now')
  `).get(operator_id).total;

  // Get recent activity
  const recentReservations = db.prepare(`
    SELECT COUNT(*) as count FROM Reservations r
    JOIN ChargingStations cs ON r.station_id = cs.station_id
    WHERE cs.operator_id = ? AND DATE(r.created_at) = DATE('now')
  `).get(operator_id).count;

  const recentSwaps = db.prepare(`
    SELECT COUNT(*) as count FROM SwapLogs sl
    JOIN BatterySwapStations bss ON sl.swap_id = bss.swap_id
    WHERE bss.operator_id = ? AND DATE(sl.swapped_at) = DATE('now')
  `).get(operator_id).count;

  res.json({
    overview: {
      total_charging_stations: chargingStations.length,
      total_swap_stations: swapStations.length,
      total_charging_slots: totalSlots,
      total_available_slots: totalAvailable,
      total_occupied_slots: totalOccupied,
      overall_utilization: totalSlots > 0 ? ((totalOccupied / totalSlots) * 100).toFixed(1) : 0
    },
    today_performance: {
      charging_revenue: parseFloat(todayRevenue),
      swap_revenue: parseFloat(swapRevenue),
      total_revenue: parseFloat(todayRevenue) + parseFloat(swapRevenue),
      reservations: recentReservations,
      swaps: recentSwaps,
      total_sessions: recentReservations + recentSwaps
    },
    stations: {
      charging: chargingStations.map(s => ({
        station_id: s.station_id,
        name: s.name,
        status: s.status,
        utilization: s.total_slots > 0 ? (((s.total_slots - s.available_slots) / s.total_slots) * 100).toFixed(1) : 0
      })),
      swap: swapStations.map(s => ({
        swap_id: s.swap_id,
        name: s.name,
        status: s.status,
        battery_stock: s.battery_stock
      }))
    }
  });
});

module.exports = {
  getChargingStations,
  getBatterySwapStations,
  getMyStations,
  createStation,
  seedStations,
  getStationById,
  getSwapStationById,
  getSwapStationBatteries,
  getDriverActiveBattery,
  registerBattery,
  updateBattery,
  simulateBatteryCharging,
  simulateBatteryDepletion,
  updateStationProfile,
  updateSwapStationProfile,
  updateSlotAvailability,
  getSlotStats,
  getSwapRequests,
  processSwapRequest,
  getStationReservations,
  updateReservationStatus,
  getStationTransactions,
  getStationActivity,
  getOperatorAnalytics
};
