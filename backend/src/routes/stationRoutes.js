const express = require('express');
const router = express.Router();
const { 
  getChargingStations, 
  getBatterySwapStations, 
  seedStations, 
  getMyStations, 
  createStation, 
  getStationById, 
  getSwapStationById,
  getSwapStationBatteries,
  getDriverActiveBattery,
  registerBattery,
  updateBattery,
  simulateBatteryCharging,
  simulateBatteryDepletion,
  updateStationProfile,
  updateSwapStationProfile,
  updateSlotAvailability,
  getSlotStats,
  getSwapRequests,
  processSwapRequest,
  getStationReservations,
  updateReservationStatus,
  getStationTransactions,
  getStationActivity,
  getOperatorAnalytics
} = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate, validateParams } = require('../middleware/validationMiddleware');
const { schemas, paramSchemas } = require('../middleware/validationMiddleware');

router.get('/charging', protect, getChargingStations);
router.get('/battery-swap', protect, getBatterySwapStations);
router.get('/me', protect, authorize('Station Operator'), getMyStations);

// Active battery route must be defined before ID parameter routes
router.get('/battery-swap/driver/active-battery', protect, getDriverActiveBattery);
router.get('/battery-swap/:id/batteries', protect, validateParams(paramSchemas.swapId), getSwapStationBatteries);

router.get('/:id', protect, validateParams(paramSchemas.stationId), getStationById);
router.get('/swap/:id', protect, validateParams(paramSchemas.swapId), getSwapStationById);

router.post('/', protect, authorize('Station Operator'), validate(schemas.createStation), createStation);
router.post('/seed', seedStations); // Public route just for MVP ease

// Operator Battery Inventory endpoints
router.post('/battery-swap/:id/batteries', protect, authorize('Station Operator'), validateParams(paramSchemas.swapId), registerBattery);
router.put('/batteries/:battery_id', protect, authorize('Station Operator'), updateBattery);
router.post('/batteries/simulate-charge', protect, authorize('Station Operator'), simulateBatteryCharging);
router.post('/batteries/simulate-depletion', protect, simulateBatteryDepletion);

// Station Profile Management
router.put('/charging/:station_id/profile', protect, authorize('Station Operator'), updateStationProfile);
router.put('/swap/:swap_id/profile', protect, authorize('Station Operator'), updateSwapStationProfile);

// Charging Slot Management
router.put('/charging/:station_id/slots', protect, authorize('Station Operator'), updateSlotAvailability);
router.get('/charging/:station_id/slots/stats', protect, authorize('Station Operator'), getSlotStats);

// Battery Swap Management
router.get('/swap/:swap_id/requests', protect, authorize('Station Operator'), getSwapRequests);
router.post('/swap/:swap_id/process', protect, authorize('Station Operator'), processSwapRequest);

// Charging Reservation Management
router.get('/charging/:station_id/reservations', protect, authorize('Station Operator'), getStationReservations);
router.put('/reservations/:reservation_id/status', protect, authorize('Station Operator'), updateReservationStatus);

// Transaction Management
router.get('/charging/:station_id/transactions', protect, authorize('Station Operator'), getStationTransactions);

// Station Activity Monitoring
router.get('/charging/:station_id/activity', protect, authorize('Station Operator'), getStationActivity);
router.get('/operator/analytics', protect, authorize('Station Operator'), getOperatorAnalytics);

module.exports = router;
