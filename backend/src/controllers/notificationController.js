const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const notifications = [];
  
  // Check for low wallet balance
  const user = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(user_id);
  if (user && user.wallet_balance < 20) {
    notifications.push({
      id: 'low-balance',
      type: 'warning',
      title: 'Low Wallet Balance',
      message: `Your wallet balance is $${user.wallet_balance.toFixed(2)}. Consider topping up to avoid service interruptions.`,
      priority: 'high',
      action: {
        text: 'Top Up Wallet',
        link: '/wallet'
      }
    });
  }
  
  // Check for upcoming reservations (within 24 hours)
  const upcomingReservations = db.prepare(`
    SELECT r.*, cs.name as station_name 
    FROM Reservations r 
    JOIN ChargingStations cs ON r.station_id = cs.station_id 
    WHERE r.user_id = ? AND r.status = 'pending'
    AND datetime(r.slot_time) > datetime('now')
    AND datetime(r.slot_time) <= datetime('now', '+24 hours')
    ORDER BY r.slot_time ASC
  `).all(user_id);
  
  upcomingReservations.forEach(reservation => {
    const slotTime = new Date(reservation.slot_time);
    const now = new Date();
    const hoursUntil = Math.round((slotTime - now) / (1000 * 60 * 60));
    
    notifications.push({
      id: `reservation-${reservation.reservation_id}`,
      type: 'info',
      title: 'Upcoming Reservation',
      message: `You have a reservation at ${reservation.station_name} in ${hoursUntil} hour(s).`,
      priority: hoursUntil <= 2 ? 'high' : 'medium',
      action: {
        text: 'View Details',
        link: '/reservations'
      }
    });
  });
  
  // Check for active battery with low charge
  const activeBattery = db.prepare(`
    SELECT * FROM Batteries 
    WHERE user_id = ? AND status = 'swapped'
  `).get(user_id);
  
  if (activeBattery && activeBattery.charge_level < 30) {
    notifications.push({
      id: 'low-battery',
      type: 'warning',
      title: 'Low Battery Charge',
      message: `Your active battery is at ${activeBattery.charge_level}% charge. Consider finding a swap station soon.`,
      priority: 'high',
      action: {
        text: 'Find Stations',
        link: '/map'
      }
    });
  }
  
  // Check for recent completed swaps that might need attention
  const recentSwaps = db.prepare(`
    SELECT sl.*, bss.name as station_name
    FROM SwapLogs sl
    JOIN BatterySwapStations bss ON sl.swap_id = bss.swap_id
    WHERE sl.user_id = ?
    ORDER BY sl.swapped_at DESC
    LIMIT 1
  `).get(user_id);
  
  if (recentSwaps) {
    const swapTime = new Date(recentSwaps.swapped_at);
    const now = new Date();
    const hoursSinceSwap = Math.round((now - swapTime) / (1000 * 60 * 60));
    
    if (hoursSinceSwap <= 1) {
      notifications.push({
        id: `swap-complete-${recentSwaps.swap_log_id}`,
        type: 'success',
        title: 'Battery Swap Complete',
        message: `Your battery swap at ${recentSwaps.station_name} was completed successfully.`,
        priority: 'low',
        action: {
          text: 'View History',
          link: '/analytics'
        }
      });
    }
  }
  
  // Check for missed reservations
  const missedReservations = db.prepare(`
    SELECT r.*, cs.name as station_name 
    FROM Reservations r 
    JOIN ChargingStations cs ON r.station_id = cs.station_id 
    WHERE r.user_id = ? AND r.status = 'missed'
    AND datetime(r.created_at) > datetime('now', '-7 days')
    ORDER BY r.slot_time DESC
  `).all(user_id);
  
  if (missedReservations.length > 0) {
    notifications.push({
      id: 'missed-reservations',
      type: 'error',
      title: 'Missed Reservations',
      message: `You have ${missedReservations.length} missed reservation(s) in the past week. Check your reservation history.`,
      priority: 'medium',
      action: {
        text: 'View Reservations',
        link: '/reservations'
      }
    });
  }
  
  // Sort notifications by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  res.json({
    notifications,
    unreadCount: notifications.length,
    hasAlerts: notifications.some(n => n.priority === 'high')
  });
});

module.exports = {
  getNotifications,
};