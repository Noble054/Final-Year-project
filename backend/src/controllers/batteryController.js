const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getBatteryHealthHistory = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  
  // Get current active battery
  const activeBattery = db.prepare(`
    SELECT * FROM Batteries 
    WHERE user_id = ? AND status = 'swapped'
  `).get(user_id);
  
  // Get battery swap history for this user
  const swapHistory = db.prepare(`
    SELECT sl.*, 
           b_out.serial_number as battery_out_serial,
           b_out.charge_level as charge_level_out,
           b_out.health_status as health_status_out,
           b_in.serial_number as battery_in_serial,
           b_in.charge_level as charge_level_in,
           b_in.health_status as health_status_in,
           bss.name as station_name
    FROM SwapLogs sl
    LEFT JOIN Batteries b_out ON sl.battery_out_id = b_out.battery_id
    LEFT JOIN Batteries b_in ON sl.battery_in_id = b_in.battery_id
    LEFT JOIN BatterySwapStations bss ON sl.swap_id = bss.swap_id
    WHERE sl.user_id = ?
    ORDER BY sl.swapped_at DESC
  `).all(user_id);
  
  // Calculate battery health trends
  const healthTrends = swapHistory.map(swap => ({
    date: swap.swapped_at,
    batteryIn: {
      serial: swap.battery_in_serial,
      health: swap.health_status_in,
      charge: swap.charge_level_in
    },
    batteryOut: {
      serial: swap.battery_out_serial,
      health: swap.health_status_out,
      charge: swap.charge_level_out
    }
  }));
  
  // Get average health of batteries user has used
  const avgHealthIn = db.prepare(`
    SELECT AVG(b_in.health_status) as avg_health
    FROM SwapLogs sl
    JOIN Batteries b_in ON sl.battery_in_id = b_in.battery_id
    WHERE sl.user_id = ?
  `).get(user_id);
  
  const avgHealthOut = db.prepare(`
    SELECT AVG(b_out.health_status) as avg_health
    FROM SwapLogs sl
    JOIN Batteries b_out ON sl.battery_out_id = b_out.battery_id
    WHERE sl.user_id = ?
  `).get(user_id);
  
  // Count total swaps
  const totalSwaps = db.prepare(`
    SELECT COUNT(*) as count FROM SwapLogs WHERE user_id = ?
  `).get(user_id).count;
  
  // Calculate cost efficiency (cost per percentage of charge gained)
  const swapEfficiency = swapHistory.map(swap => {
    const chargeGained = swap.charge_level_in - swap.charge_level_out;
    return {
      date: swap.swapped_at,
      chargeGained: chargeGained > 0 ? chargeGained : 0,
      cost: swap.cost,
      costPerPercent: chargeGained > 0 ? (swap.cost / chargeGained).toFixed(2) : 0
    };
  });
  
  const avgCostPerPercent = swapEfficiency.length > 0 
    ? (swapEfficiency.reduce((sum, s) => sum + parseFloat(s.costPerPercent), 0) / swapEfficiency.length).toFixed(2)
    : 0;
  
  res.json({
    activeBattery,
    swapHistory,
    healthTrends,
    statistics: {
      totalSwaps,
      avgHealthIncoming: avgHealthIn.avg_health ? Math.round(avgHealthIn.avg_health) : 0,
      avgHealthOutgoing: avgHealthOut.avg_health ? Math.round(avgHealthOut.avg_health) : 0,
      avgCostPerPercent,
      swapEfficiency: swapEfficiency.slice(0, 10)
    }
  });
});

module.exports = {
  getBatteryHealthHistory,
};