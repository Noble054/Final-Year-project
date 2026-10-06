const express = require('express');
const router = express.Router();
const { getBatteryHealthHistory } = require('../controllers/batteryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/health-history')
  .get(protect, getBatteryHealthHistory);

module.exports = router;