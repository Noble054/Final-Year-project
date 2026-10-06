const express = require('express');
const router = express.Router();
const { 
  getOverview, 
  getUsers, 
  getSubscriptionPlans,
  getNetworkHealth,
  getSystemSettings,
  updateSystemSettings,
  updateSubscriptionPlan,
  updateUserApprovalStatus,
  deleteUser 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/overview', protect, authorize('Admin'), getOverview);
router.get('/users', protect, authorize('Admin'), getUsers);
router.get('/subscription-plans', protect, authorize('Admin'), getSubscriptionPlans);
router.get('/network-health', protect, authorize('Admin'), getNetworkHealth);
router.get('/system-settings', protect, authorize('Admin'), getSystemSettings);
router.put('/system-settings', protect, authorize('Admin'), updateSystemSettings);
router.put('/subscription-plans/:plan_id', protect, authorize('Admin'), updateSubscriptionPlan);
router.put('/users/:user_id/status', protect, authorize('Admin'), updateUserApprovalStatus);
router.delete('/users/:user_id', protect, authorize('Admin'), deleteUser);

module.exports = router;
