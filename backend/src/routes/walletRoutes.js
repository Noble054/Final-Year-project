const express = require('express');
const router = express.Router();
const { getBalance, topUp, getUsageAnalytics } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { schemas } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, getBalance)
  .post(protect, validate(schemas.addFunds), topUp);

router.route('/analytics')
  .get(protect, getUsageAnalytics);

module.exports = router;
