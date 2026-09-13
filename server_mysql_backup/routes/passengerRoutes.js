const express = require("express");

const {
    bookRide,
    requestRide,
    getMyBookings,
    getAcceptedRide,
    calculateFare,
    updatePaymentMethod,
    completeCashPayment
} = require("../controllers/passengerController");

const router = express.Router();


// ============================================================
// BOOK RIDE
// POST /api/rides/book
// ============================================================

router.post(
    "/book",
    bookRide
);


// ============================================================
// REQUEST PARTICULAR RIDER
// POST /api/rides/request
// ============================================================

router.post(
    "/request",
    requestRide
);


// ============================================================
// PASSENGER RIDE HISTORY
// GET /api/rides/history/:passengerId
// ============================================================

router.get(
    "/history/:passengerId",
    getMyBookings
);


// ============================================================
// ACCEPTED / ACTIVE RIDE
// GET /api/rides/accepted/:passengerId
// ============================================================

router.get(
    "/accepted/:passengerId",
    getAcceptedRide
);


// ============================================================
// CALCULATE FARE
// POST /api/rides/calculate-fare
// ============================================================

router.post(
    "/calculate-fare",
    calculateFare
);


// ============================================================
// UPDATE PAYMENT METHOD
// PUT /api/rides/payment-method
// ============================================================

router.put(
    "/payment-method",
    updatePaymentMethod
);


// ============================================================
// COMPLETE CASH PAYMENT
// PUT /api/rides/cash-payment
// ============================================================

router.put(
    "/cash-payment",
    completeCashPayment
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;