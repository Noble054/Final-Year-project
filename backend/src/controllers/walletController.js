const { db } = require('../config/db');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const getBalance = asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const transactions = db.prepare('SELECT * FROM Transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  
  res.json({ balance: user.wallet_balance, transactions });
});

const getUsageAnalytics = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  
  // Get transaction analytics
  const transactions = db.prepare('SELECT * FROM Transactions WHERE user_id = ? ORDER BY created_at DESC').all(user_id);
  
  // Calculate spending by type
  const spendingByType = db.prepare(`
    SELECT type, SUM(amount) as total, COUNT(*) as count 
    FROM Transactions 
    WHERE user_id = ? 
    GROUP BY type
  `).all(user_id);
  
  // Get monthly spending trend
  const monthlySpending = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      SUM(CASE WHEN type = 'charge' OR type = 'penalty' OR type = 'swap' THEN amount ELSE 0 END) as spent,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as deposited
    FROM Transactions 
    WHERE user_id = ? 
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).all(user_id);
  
  // Get reservation stats
  const reservations = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM Reservations 
    WHERE user_id = ? 
    GROUP BY status
  `).all(user_id);
  
  // Get swap history
  const swapHistory = db.prepare(`
    SELECT sl.*, b_out.serial_number as battery_out_serial, b_in.serial_number as battery_in_serial,
           bss.name as station_name
    FROM SwapLogs sl
    LEFT JOIN Batteries b_out ON sl.battery_out_id = b_out.battery_id
    LEFT JOIN Batteries b_in ON sl.battery_in_id = b_in.battery_id
    LEFT JOIN BatterySwapStations bss ON sl.swap_id = bss.swap_id
    WHERE sl.user_id = ?
    ORDER BY sl.swapped_at DESC
    LIMIT 10
  `).all(user_id);
  
  // Calculate total spent and total deposited
  const totalSpent = transactions
    .filter(t => ['charge', 'penalty', 'swap'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalDeposited = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  res.json({
    transactions: transactions.slice(0, 20), // Last 20 transactions
    spendingByType,
    monthlySpending: monthlySpending.reverse(), // Chronological order
    reservationStats: reservations,
    swapHistory,
    summary: {
      totalSpent,
      totalDeposited,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? totalDeposited / transactions.length : 0
    }
  });
});

const topUp = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const stmt = db.prepare('UPDATE Users SET wallet_balance = wallet_balance + ? WHERE user_id = ?');
  stmt.run(amount, req.user.id);

  const transStmt = db.prepare('INSERT INTO Transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)');
  transStmt.run(req.user.id, amount, 'deposit', 'Wallet top-up');

  const updatedUser = db.prepare('SELECT wallet_balance FROM Users WHERE user_id = ?').get(req.user.id);

  res.json({ message: 'Top up successful', balance: updatedUser.wallet_balance });
});

module.exports = {
  getBalance,
  topUp,
  getUsageAnalytics,
};
