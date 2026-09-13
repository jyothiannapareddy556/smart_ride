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
    getRideHistory
} = require("../controllers/riderController");

const router = express.Router();

router.get("/pending", getPendingRides);

router.put("/accept/:id", acceptRide);

router.put("/reject/:id", rejectRide);

router.put("/start/:bookingId", startRide);

router.put("/complete/:bookingId", completeRide);

router.put("/location", updateLocation);

router.put("/online", goOnline);

router.put("/offline", goOffline);

router.get("/history/:rider_id", getRideHistory);

module.exports = router;