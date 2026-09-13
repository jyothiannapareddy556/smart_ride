const express = require("express");

const {
  getPendingRides,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  updateLocation,
  goOnline,
  goOffline,
  getRideHistory,
} = require("../controllers/riderController");

const router = express.Router();

// Get pending / active rides
router.get("/pending", getPendingRides);

// Accept ride
router.put("/accept/:id", acceptRide);

// Reject ride
router.put("/reject/:id", rejectRide);

// Start ride
router.put("/start/:bookingId", startRide);

// Complete ride
router.put("/complete/:bookingId", completeRide);

// Update rider location
router.put("/location", updateLocation);

// Go online
router.put("/online", goOnline);

// Go offline
router.put("/offline", goOffline);

// Rider ride history
router.get("/history/:rider_id", getRideHistory);

module.exports = router;