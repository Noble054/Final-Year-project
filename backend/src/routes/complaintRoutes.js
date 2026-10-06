const express = require('express');
const router = express.Router();
const { getMyComplaints, submitComplaint } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('EV Driver'));
router.get('/', getMyComplaints);
router.post('/', submitComplaint);

module.exports = router;
