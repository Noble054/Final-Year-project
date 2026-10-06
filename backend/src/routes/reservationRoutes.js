const express = require('express');
const router = express.Router();
const { getBookingSettings, bookSlot, checkIn, completeSession, getMyReservations, requestSwap, getOperatorReservations } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');
const { validate, validateParams } = require('../middleware/validationMiddleware');
const { schemas, paramSchemas } = require('../middleware/validationMiddleware');

router.get('/', protect, getMyReservations);
router.get('/operator', protect, getOperatorReservations);
router.get('/settings', protect, getBookingSettings);
router.post('/book', protect, validate(schemas.bookSlot), bookSlot);
router.post('/:reservation_id/checkin', protect, validateParams(paramSchemas.reservationId), checkIn);
router.post('/:reservation_id/complete', protect, validateParams(paramSchemas.reservationId), completeSession);
router.post('/swap', protect, validate(schemas.requestSwap), requestSwap);

module.exports = router;
