const { db } = require('../config/db');
const { getSystemSetting } = require('../config/systemSettings');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getBookingSettings = asyncHandler(async (req, res) => {
  res.json({
    reservationDeposit: getSystemSetting('reservationDeposit'),
    sessionCompletionFee: getSystemSetting('sessionCompletionFee'),
  });
});

const bookSlot = asyncHandler(async (req, res) => {
  const { station_id, slot_time } = req.body;
  const user_id = req.user.id;

  const station = db.prepare('SELECT available_slots, price_per_kwh FROM ChargingStations WHERE station_id = ?').get(station_id);
  if (!station) {
    throw new AppError('Station not found', 404);
  }
  if (station.available_slots <= 0) {
    throw new AppError('No available slots', 400);
  }

  const user = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(user_id);
  const depositAmount = getSystemSetting('reservationDeposit');

  if (user.wallet_balance < depositAmount) {
    throw new AppError('Insufficient funds for deposit', 400);
  }

  // Deduct deposit
  db.prepare('UPDATE Users SET wallet_balance = wallet_balance - ? WHERE user_id = ?').run(depositAmount, user_id);
  db.prepare('INSERT INTO Transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(user_id, depositAmount, 'charge', 'Reservation Deposit');

  // Decrease available slots
  db.prepare('UPDATE ChargingStations SET available_slots = available_slots - 1 WHERE station_id = ?').run(station_id);

  // Ensure slot_time is a string (ISO) before binding to SQLite
  let slotTimeToStore = slot_time;
  if (slotTimeToStore instanceof Date) slotTimeToStore = slotTimeToStore.toISOString();
  if (typeof slotTimeToStore !== 'string') slotTimeToStore = String(slotTimeToStore);

  // Create reservation
  const stmt = db.prepare('INSERT INTO Reservations (user_id, station_id, slot_time, status, deposit_amount) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(user_id, station_id, slotTimeToStore, 'pending', depositAmount);

  res.status(201).json({ message: 'Reservation created', reservation_id: info.lastInsertRowid });
});

const checkIn = asyncHandler(async (req, res) => {
  const { reservation_id } = req.params;
  const user_id = req.user.id;

  const reservation = db.prepare('SELECT * FROM Reservations WHERE reservation_id = ? AND user_id = ?').get(reservation_id, user_id);
  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }
  if (reservation.status !== 'pending') {
    throw new AppError('Reservation is not pending', 400);
  }

  // In a real app, check if current time is within +/- 15 mins of slot_time
  // For MVP, we just allow check-in
  db.prepare('UPDATE Reservations SET status = ? WHERE reservation_id = ?').run('confirmed', reservation_id);

  res.json({ message: 'Checked in successfully' });
});

const completeSession = asyncHandler(async (req, res) => {
  const { reservation_id } = req.params;
  const user_id = req.user.id;

  const reservation = db.prepare('SELECT * FROM Reservations WHERE reservation_id = ? AND user_id = ?').get(reservation_id, user_id);
  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }
  if (reservation.status !== 'confirmed') {
    throw new AppError('Session not active', 400);
  }

  const remainingCost = getSystemSetting('sessionCompletionFee');
  
  const user = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(user_id);
  if (user.wallet_balance < remainingCost) {
    // In real life, let balance go negative or handle gracefully. We will allow negative.
  }

  db.prepare('UPDATE Users SET wallet_balance = wallet_balance - ? WHERE user_id = ?').run(remainingCost, user_id);
  db.prepare('INSERT INTO Transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(user_id, remainingCost, 'charge', 'Session completion fee');
  
  db.prepare('UPDATE Reservations SET status = ? WHERE reservation_id = ?').run('completed', reservation_id);
  db.prepare('UPDATE ChargingStations SET available_slots = available_slots + 1 WHERE station_id = ?').run(reservation.station_id);

  res.json({ message: 'Session completed successfully' });
});

const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = db.prepare(`
    SELECT r.*, c.name as station_name 
    FROM Reservations r 
    JOIN ChargingStations c ON r.station_id = c.station_id 
    WHERE r.user_id = ? 
    ORDER BY r.slot_time DESC
  `).all(req.user.id);
  res.json(reservations);
});

const requestSwap = asyncHandler(async (req, res) => {
  const { swap_id, battery_id } = req.body;
  const user_id = req.user.id;

  const station = db.prepare('SELECT name, battery_stock FROM BatterySwapStations WHERE swap_id = ?').get(swap_id);
  if (!station) {
    throw new AppError('Battery swap station not found', 404);
  }

  // Check if user already has an active battery that's not depleted
  const activeBattery = db.prepare(
    'SELECT * FROM Batteries WHERE user_id = ? AND status = ?'
  ).get(user_id, 'swapped');

  if (activeBattery) {
    // Define depleted threshold (e.g., 30% charge level)
    const depletedThreshold = 30;
    if (activeBattery.charge_level > depletedThreshold) {
      throw new AppError(
        `You already have an active battery (${activeBattery.serial_number}) with ${activeBattery.charge_level}% charge. You can only swap when your current battery is depleted (below ${depletedThreshold}%).`,
        400
      );
    }
  }

  // Find the specific battery if battery_id is provided, otherwise find the best available
  let bestBattery;
  if (battery_id) {
    bestBattery = db.prepare(
      'SELECT * FROM Batteries WHERE battery_id = ? AND swap_id = ? AND status = ? AND charge_level >= 70'
    ).get(battery_id, swap_id, 'available');
    if (!bestBattery) {
      throw new AppError('Selected battery not available or does not meet minimum charge requirements (70%)', 400);
    }
  } else {
    // Find the best available battery (status = 'available', charge_level >= 90) at the specified station
    bestBattery = db.prepare(
      'SELECT * FROM Batteries WHERE swap_id = ? AND status = ? AND charge_level >= 90 ORDER BY charge_level DESC LIMIT 1'
    ).get(swap_id, 'available');

    if (!bestBattery) {
      throw new AppError('No charged batteries available at this station (charge level >= 90% required)', 400);
    }
  }

  const swapFee = getSystemSetting('batterySwapFee');
  const user = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(user_id);
  if (user.wallet_balance < swapFee) {
    throw new AppError('Insufficient funds for battery swap', 400);
  }

  const executeTransaction = db.transaction(() => {
    // 1. Deduct wallet balance
    db.prepare('UPDATE Users SET wallet_balance = wallet_balance - ? WHERE user_id = ?').run(swapFee, user_id);

    // 2. Add transaction record
    db.prepare(
      'INSERT INTO Transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
    ).run(user_id, swapFee, 'swap', `Battery Swap at ${station.name}`);

    // 3. Handle the battery return (if active battery exists)
    let batteryInId = null;
    let chargeLevelIn = null;

    if (activeBattery) {
      batteryInId = activeBattery.battery_id;
      chargeLevelIn = activeBattery.charge_level; // Use actual charge level
      
      // Update returned battery: set swap_id to this station, status to 'charging', clear user_id
      db.prepare(
        'UPDATE Batteries SET swap_id = ?, user_id = NULL, status = ?, charge_level = ? WHERE battery_id = ?'
      ).run(swap_id, 'charging', chargeLevelIn, batteryInId);
    } else {
      // Mock returned battery check-in for first-time users
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      chargeLevelIn = Math.floor(15 + Math.random() * 6); // 15 to 20
      const mockResult = db.prepare(
        'INSERT INTO Batteries (swap_id, serial_number, charge_level, health_status, status) VALUES (?, ?, ?, 90, ?)'
      ).run(swap_id, `CM-BATT-${randSuffix}`, chargeLevelIn, 'charging');
      batteryInId = mockResult.lastInsertRowid;
    }

    // 4. Update the outgoing battery status to 'swapped' and assign to user, clear swap_id
    db.prepare(
      'UPDATE Batteries SET swap_id = NULL, user_id = ?, status = ? WHERE battery_id = ?'
    ).run(user_id, 'swapped', bestBattery.battery_id);

    // 5. Create a SwapLog entry
    db.prepare(
      `INSERT INTO SwapLogs (swap_id, user_id, battery_out_id, battery_in_id, charge_level_in, charge_level_out, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      swap_id,
      user_id,
      bestBattery.battery_id,
      batteryInId,
      chargeLevelIn,
      bestBattery.charge_level,
      swapFee
    );

    // 6. Recalculate battery_stock at BatterySwapStations (available batteries count)
    const availableCount = db.prepare(
      'SELECT COUNT(*) as count FROM Batteries WHERE swap_id = ? AND status = ?'
    ).get(swap_id, 'available').count;

    db.prepare('UPDATE BatterySwapStations SET battery_stock = ? WHERE swap_id = ?').run(availableCount, swap_id);

    return {
      serialNumber: bestBattery.serial_number,
      chargeLevel: bestBattery.charge_level
    };
  });

  const result = executeTransaction();

  res.json({
    message: 'Battery swap completed successfully',
    batteryOut: result.serialNumber,
    chargeLevelOut: result.chargeLevel
  });
});

const getOperatorReservations = asyncHandler(async (req, res) => {
  const reservations = db.prepare(`
    SELECT r.*, c.name as station_name, u.name as user_name 
    FROM Reservations r 
    JOIN ChargingStations c ON r.station_id = c.station_id 
    JOIN Users u ON r.user_id = u.user_id
    WHERE c.operator_id = ? 
    ORDER BY r.slot_time ASC
  `).all(req.user.id);
  res.json(reservations);
});

module.exports = {
  getBookingSettings,
  bookSlot,
  checkIn,
  completeSession,
  getMyReservations,
  requestSwap,
  getOperatorReservations
};
