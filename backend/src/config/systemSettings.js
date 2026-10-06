const { db } = require('./db');
const config = require('./index');

const defaults = {
  reservationDeposit: config.payment.reservationDeposit,
  sessionCompletionFee: config.payment.sessionCompletionFee,
  batterySwapFee: config.payment.batterySwapFee,
  penaltyAmount: config.payment.penaltyAmount,
  penaltyTimeWindowMinutes: config.payment.penaltyTimeWindowMinutes,
};

const getSystemSetting = (key) => {
  const row = db.prepare('SELECT setting_value FROM SystemSettings WHERE setting_key = ?').get(key);
  return row ? Number(row.setting_value) : defaults[key];
};

module.exports = { getSystemSetting };
