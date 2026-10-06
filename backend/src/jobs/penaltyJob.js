const cron = require('node-cron');
const { db } = require('../config/db');
const config = require('../config');
const { getSystemSetting } = require('../config/systemSettings');
const logger = require('../config/logger');

// Run based on configured cron schedule
cron.schedule(config.penaltyJobCron, () => {
  logger.info('Running penalty job...');
  try {
    const pendingReservations = db.prepare(`
      SELECT * FROM Reservations 
      WHERE status = 'pending'
    `).all();

    const cutoffTime = Date.now() - getSystemSetting('penaltyTimeWindowMinutes') * 60 * 1000;

    for (const res of pendingReservations) {
      // Append 'Z' to treat the datetime-local string as UTC (matching GMT)
      const slotTimeStr = res.slot_time.endsWith('Z') ? res.slot_time : res.slot_time + 'Z';
      const slotTimestamp = new Date(slotTimeStr).getTime();

      if (slotTimestamp <= cutoffTime) {
        // Set to missed
        db.prepare('UPDATE Reservations SET status = ? WHERE reservation_id = ?').run('missed', res.reservation_id);
        
        // Use configured penalty amount
        const penaltyAmount = getSystemSetting('penaltyAmount');
        
        // Deduct from wallet
        db.prepare('UPDATE Users SET wallet_balance = wallet_balance - ? WHERE user_id = ?').run(penaltyAmount, res.user_id);
        
        // Log transaction
        db.prepare('INSERT INTO Transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(res.user_id, penaltyAmount, 'penalty', 'Missed Reservation Penalty');

        // Free up slot
        db.prepare('UPDATE ChargingStations SET available_slots = available_slots + 1 WHERE station_id = ?').run(res.station_id);
        
        logger.info(`Applied penalty to reservation ${res.reservation_id}`);
      }
    }
  } catch (error) {
    logger.error('Error running penalty job:', error);
  }
});
