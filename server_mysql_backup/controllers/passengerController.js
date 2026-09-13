const db = require("../config/db");
const axios = require("axios");

const getRoadDistance = async (
    pickupLat,
    pickupLng,
    dropLat,
    dropLng
) => {
    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${pickupLng},${pickupLat};${dropLng},${dropLat}` +
        `?overview=false`;

    const response = await axios.get(url, {
        timeout: 15000,
        headers: {
            "User-Agent": "RideBack/1.0"
        }
    });

    if (
        !response.data ||
        response.data.code !== "Ok"
    ) {
        throw new Error(
            "Failed to get road distance"
        );
    }

    if (
        !response.data.routes ||
        response.data.routes.length === 0
    ) {
        throw new Error("No route found");
    }

    const distanceKm =
        response.data.routes[0].distance / 1000;

    return Number(
        distanceKm.toFixed(2)
    );
};
// ============================================================
// CALCULATE DISTANCE BETWEEN TWO LOCATIONS
// ============================================================



// ============================================================
// BOOK RIDE
// ============================================================
// ============================================================
// CALCULATE DISTANCE BETWEEN TWO LOCATIONS
// ============================================================


const bookRide = async (req, res) => {
    try {
        const {
            passenger_id,
            pickup_location,
            drop_location,
            passengers,
            pickup_lat,
            pickup_lng,
            drop_lat,
            drop_lng
        } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (
            !passenger_id ||
            !pickup_location ||
            !drop_location
        ) {
            return res.status(400).json({
                message:
                    "Passenger, pickup and destination are required."
            });
        }

        const passengerCount =
            Number(passengers) || 1;

        if (passengerCount < 1) {
            return res.status(400).json({
                message:
                    "Number of passengers must be at least 1."
            });
        }

        // ----------------------------------------------------
        // CHECK PASSENGER
        // ----------------------------------------------------

        const [passengerRows] = await db.query(
            `
            SELECT
                id,
                name,
                phone
            FROM users
            WHERE id = ?
            AND role = 'passenger'
            `,
            [passenger_id]
        );

        if (passengerRows.length === 0) {
            return res.status(404).json({
                message:
                    "Passenger not found."
            });
        }

        // ----------------------------------------------------
        // CREATE BOOKING
        // ----------------------------------------------------

        const [result] = await db.query(
            `
            INSERT INTO bookings
            (
                passenger_id,
                pickup_location,
                drop_location,
                passengers,
                pickup_lat,
                pickup_lng,
                drop_lat,
                drop_lng,
                status,
                booking_date
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            `,
            [
                passenger_id,
                pickup_location.trim(),
                drop_location.trim(),
                passengerCount,
                pickup_lat ?? null,
                pickup_lng ?? null,
                drop_lat ?? null,
                drop_lng ?? null
            ]
        );

        const bookingId =
            result.insertId;

        // ----------------------------------------------------
        // CALCULATE ROAD DISTANCE
        // ----------------------------------------------------

        let distanceKm = null;

        const hasCoordinates =
            pickup_lat !== null &&
            pickup_lat !== undefined &&
            pickup_lng !== null &&
            pickup_lng !== undefined &&
            drop_lat !== null &&
            drop_lat !== undefined &&
            drop_lng !== null &&
            drop_lng !== undefined;

        if (hasCoordinates) {

            try {

                distanceKm =
                    await getRoadDistance(
                        pickup_lat,
                        pickup_lng,
                        drop_lat,
                        drop_lng
                    );

                console.log(
                    "AUTOMATIC ROAD DISTANCE:",
                    distanceKm,
                    "KM"
                );

                if (distanceKm !== null) {

                    await db.query(
                        `
                        UPDATE bookings
                        SET distance_km = ?
                        WHERE id = ?
                        `,
                        [
                            distanceKm,
                            bookingId
                        ]
                    );
                }

            } catch (distanceError) {

                console.error(
                    "OSRM DISTANCE ERROR:",
                    distanceError.message
                );

                console.log(
                    "Booking will continue without automatic distance."
                );

                distanceKm = null;
            }
        }

        // ----------------------------------------------------
        // FIND AVAILABLE RIDERS
        // ----------------------------------------------------

        const [riders] = await db.query(
            `
            SELECT
                id,
                name,
                phone,
                current_location,
                availability
            FROM users
            WHERE role = 'rider'
            AND availability = 'available'
            ORDER BY id DESC
            `
        );

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(201).json({
            message:
                "Ride request created successfully.",

            booking_id:
                bookingId,

            distance_km:
                distanceKm,

            riders:
                riders
        });

    } catch (error) {

        console.error(
            "BOOK RIDE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to book ride.",

            error:
                error.message
        });
    }
};


// ============================================================
// REQUEST A PARTICULAR RIDER
// ============================================================

const requestRide = async (req, res) => {
    try {
        const {
            booking_id,
            rider_id
        } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!booking_id || !rider_id) {
            return res.status(400).json({
                message:
                    "Booking ID and Rider ID are required."
            });
        }

        // ----------------------------------------------------
        // CHECK BOOKING
        // ----------------------------------------------------

        const [bookingRows] = await db.query(
            `
            SELECT
                id,
                passenger_id,
                rider_id,
                status
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (bookingRows.length === 0) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const booking = bookingRows[0];

        // ----------------------------------------------------
        // CHECK WHETHER BOOKING ALREADY HAS RIDER
        // ----------------------------------------------------

        if (
            booking.rider_id !== null &&
            booking.rider_id !== undefined
        ) {
            return res.status(400).json({
                message:
                    "A rider has already been selected for this booking."
            });
        }

        // ----------------------------------------------------
        // CHECK RIDER
        // ----------------------------------------------------

        const [riderRows] = await db.query(
            `
            SELECT
                id,
                name,
                phone,
                current_location,
                availability,
                role
            FROM users
            WHERE id = ?
            AND role = 'rider'
            `,
            [rider_id]
        );

        if (riderRows.length === 0) {
            return res.status(404).json({
                message: "Rider not found."
            });
        }

        const rider = riderRows[0];

        // ----------------------------------------------------
        // CHECK RIDER AVAILABILITY
        // ----------------------------------------------------

        if (
            rider.availability !== "available"
        ) {
            return res.status(400).json({
                message:
                    "This rider is no longer available."
            });
        }

        // ----------------------------------------------------
        // ASSIGN RIDER
        // ----------------------------------------------------

        const [updateResult] = await db.query(
            `
            UPDATE bookings
            SET
                rider_id = ?,
                status = 'pending'
            WHERE id = ?
            `,
            [
                rider_id,
                booking_id
            ]
        );

        if (
            updateResult.affectedRows === 0
        ) {
            return res.status(400).json({
                message:
                    "Unable to request this rider."
            });
        }

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            message:
                "Ride request sent successfully!",
            booking_id: booking_id,
            rider_id: rider_id,
            rider: rider
        });

    } catch (error) {

        console.error(
            "REQUEST RIDE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to request rider.",
            error: error.message
        });
    }
};


// ============================================================
// GET PASSENGER RIDE HISTORY
// ============================================================

const getMyBookings = async (req, res) => {
    try {
        const {
            passengerId
        } = req.params;

        if (!passengerId) {
            return res.status(400).json({
                message:
                    "Passenger ID is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                b.id,
                b.passenger_id,
                b.rider_id,

                b.pickup_location,
                b.drop_location,

                b.passengers,
                b.status,
                b.booking_date,

                u.name AS rider_name,
                u.phone AS rider_phone,
                u.current_location AS rider_location,

                b.distance_km,
                b.base_fare,
                b.discount,
                b.final_fare,

                b.payment_method,
                b.payment_status

            FROM bookings b

            LEFT JOIN users u
                ON b.rider_id = u.id

            WHERE b.passenger_id = ?

            ORDER BY b.booking_date DESC
            `,
            [passengerId]
        );

        return res.status(200).json(
            rows
        );

    } catch (error) {

        console.error(
            "GET PASSENGER HISTORY ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch ride history.",
            error: error.message
        });
    }
};


// ============================================================
// GET ACCEPTED / ACTIVE RIDE
// ============================================================

const getAcceptedRide = async (req, res) => {
    try {
        const { passengerId } = req.params;

        if (!passengerId) {
            return res.status(400).json({
                message: "Passenger ID is required."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                b.id AS booking_id,
                b.id,

                b.passenger_id,
                b.rider_id,

                b.pickup_location,
                b.drop_location,

                b.pickup_lat,
                b.pickup_lng,
                b.drop_lat,
                b.drop_lng,

                b.passengers,
                b.status,
                b.booking_date,
                u.name AS rider_name,
                u.phone AS rider_phone,
                u.current_location AS rider_location,

                b.distance_km,
                b.base_fare,
                b.discount,
                b.final_fare,

                b.payment_method,
                b.payment_status

            FROM bookings b

            LEFT JOIN users u
                ON b.rider_id = u.id

            WHERE b.passenger_id = ?

            AND b.status IN (
                'accepted',
                'ongoing',
                'completed'
            )

            AND b.id = (
                SELECT MAX(b2.id)
                FROM bookings b2
                WHERE b2.passenger_id = ?
                AND b2.status IN (
                    'accepted',
                    'ongoing',
                    'completed'
                )
            )

            ORDER BY b.booking_date DESC

            LIMIT 1
            `,
            [passengerId, passengerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No active ride found."
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            "GET ACCEPTED RIDE ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to fetch accepted ride.",
            error: error.message
        });
    }
};


// ============================================================
// CALCULATE FARE
// ============================================================

const calculateFare = async (req, res) => {
    try {
        const {
            booking_id,
            distance_km,
            passengers
        } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!booking_id) {
            return res.status(400).json({
                message:
                    "Booking ID is required."
            });
        }

        if (
            distance_km === undefined ||
            distance_km === null ||
            Number(distance_km) <= 0
        ) {
            return res.status(400).json({
                message:
                    "Valid distance is required."
            });
        }

        const distance =
            Number(distance_km);

        const passengerCount =
            Number(passengers) || 1;

        if (passengerCount < 1) {
            return res.status(400).json({
                message:
                    "Invalid passenger count."
            });
        }

        // ----------------------------------------------------
        // CHECK BOOKING
        // ----------------------------------------------------

        const [bookingRows] = await db.query(
            `
            SELECT
                id,
                passenger_id,
                status,
                passengers
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (bookingRows.length === 0) {
            return res.status(404).json({
                message:
                    "Booking not found."
            });
        }

        // ----------------------------------------------------
        // FARE CALCULATION
        // ----------------------------------------------------

        /*
            Smart Ride fare:

            Rate = ₹10.60 per km

            Discount = 20%

            Example:

            Distance = 50 km

            Base Fare
            = 50 × 10.60
            = ₹530

            Discount
            = 20% of ₹530
            = ₹106

            Final Fare
            = ₹424
        */

        const RATE_PER_KM = 10.60;

        const DISCOUNT_PERCENT = 20;

        const baseFare =
            distance *
            RATE_PER_KM;

        const discount =
            baseFare *
            (DISCOUNT_PERCENT / 100);

        const finalFare =
            baseFare -
            discount;

        const roundedDistance =
            Number(
                distance.toFixed(2)
            );

        const roundedBaseFare =
            Number(
                baseFare.toFixed(2)
            );

        const roundedDiscount =
            Number(
                discount.toFixed(2)
            );

        const roundedFinalFare =
            Number(
                finalFare.toFixed(2)
            );

        // ----------------------------------------------------
        // SAVE FARE
        // ----------------------------------------------------

        await db.query(
            `
            UPDATE bookings
            SET
                distance_km = ?,
                base_fare = ?,
                discount = ?,
                final_fare = ?
            WHERE id = ?
            `,
            [
                roundedDistance,
                roundedBaseFare,
                roundedDiscount,
                roundedFinalFare,
                booking_id
            ]
        );

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            message:
                "Fare calculated successfully.",

            booking_id: booking_id,

            distance_km:
                roundedDistance,

            passengers:
                passengerCount,

            base_fare:
                roundedBaseFare,

            discount:
                roundedDiscount,

            final_fare:
                roundedFinalFare,

            payment_method:
                "cash",

            payment_status:
                "pending"
        });

    } catch (error) {

        console.error(
            "CALCULATE FARE ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to calculate fare.",
            error: error.message
        });
    }
};


// ============================================================
// UPDATE PAYMENT METHOD
// ============================================================

const updatePaymentMethod = async (
    req,
    res
) => {
    try {
        const {
            booking_id,
            payment_method
        } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!booking_id) {
            return res.status(400).json({
                message:
                    "Booking ID is required."
            });
        }

        if (
            payment_method !== "cash" &&
            payment_method !== "online"
        ) {
            return res.status(400).json({
                message:
                    "Payment method must be cash or online."
            });
        }

        // ----------------------------------------------------
        // CHECK BOOKING
        // ----------------------------------------------------

        const [bookingRows] = await db.query(
            `
            SELECT
                id,
                final_fare,
                payment_status
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (bookingRows.length === 0) {
            return res.status(404).json({
                message:
                    "Booking not found."
            });
        }

        const booking =
            bookingRows[0];

        // ----------------------------------------------------
        // SAVE PAYMENT METHOD
        // ----------------------------------------------------

        await db.query(
            `
            UPDATE bookings
            SET payment_method = ?
            WHERE id = ?
            `,
            [
                payment_method,
                booking_id
            ]
        );

        return res.status(200).json({
            message:
                "Payment method updated successfully.",

            booking_id:
                booking_id,

            payment_method:
                payment_method,

            payment_status:
                booking.payment_status ||
                "pending",

            final_fare:
                booking.final_fare
        });

    } catch (error) {

        console.error(
            "UPDATE PAYMENT METHOD ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to update payment method.",
            error: error.message
        });
    }
};


// ============================================================
// COMPLETE CASH PAYMENT
// ============================================================

// ============================================================
// COMPLETE CASH PAYMENT
// ============================================================

const completeCashPayment = async (req, res) => {
    try {
        const {
            booking_id
        } = req.body;

        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!booking_id) {
            return res.status(400).json({
                message:
                    "Booking ID is required."
            });
        }

        // ----------------------------------------------------
        // GET BOOKING
        // ----------------------------------------------------

        const [bookingRows] = await db.query(
            `
            SELECT
                id,
                status,
                distance_km,
                base_fare,
                discount,
                final_fare,
                payment_method,
                payment_status
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (bookingRows.length === 0) {
            return res.status(404).json({
                message:
                    "Booking not found."
            });
        }

        const booking = bookingRows[0];

        console.log(
            "CASH PAYMENT REQUEST:",
            {
                booking_id: booking.id,
                status: booking.status,
                distance_km: booking.distance_km,
                final_fare: booking.final_fare,
                payment_method: booking.payment_method,
                payment_status: booking.payment_status
            }
        );

        // ----------------------------------------------------
        // RIDE MUST BE COMPLETED
        // ----------------------------------------------------

        if (booking.status !== "completed") {
            return res.status(400).json({
                message:
                    "Cash payment is available only after ride completion."
            });
        }

        // ----------------------------------------------------
        // CHECK PAYMENT METHOD
        // ----------------------------------------------------

        if (
            booking.payment_method !== "cash"
        ) {
            return res.status(400).json({
                message:
                    "Please select Cash payment first."
            });
        }

        // ----------------------------------------------------
        // ALREADY PAID
        // ----------------------------------------------------

        if (
            booking.payment_status === "paid"
        ) {
            return res.status(200).json({
                message:
                    "Payment has already been completed.",

                booking_id:
                    booking.id,

                final_fare:
                    Number(booking.final_fare),

                payment_method:
                    "cash",

                payment_status:
                    "paid"
            });
        }

        // ----------------------------------------------------
        // RESTORE FARE IF MISSING
        // ----------------------------------------------------

        let finalFare =
            Number(booking.final_fare);

        if (
            !finalFare ||
            finalFare <= 0
        ) {

            const distanceKm =
                Number(booking.distance_km);

            if (
                !distanceKm ||
                distanceKm <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Fare has not been calculated and valid distance is unavailable."
                });
            }

            // RideBack fare rules
            // ₹10.60 per KM
            // 20% discount

            const baseFare =
                Number(
                    (
                        distanceKm * 10.60
                    ).toFixed(2)
                );

            const discount =
                Number(
                    (
                        baseFare * 0.20
                    ).toFixed(2)
                );

            finalFare =
                Number(
                    (
                        baseFare - discount
                    ).toFixed(2)
                );

            // ------------------------------------------------
            // SAVE RESTORED FARE
            // ------------------------------------------------

            await db.query(
                `
                UPDATE bookings
                SET
                    distance_km = ?,
                    base_fare = ?,
                    discount = ?,
                    final_fare = ?
                WHERE id = ?
                `,
                [
                    distanceKm,
                    baseFare,
                    discount,
                    finalFare,
                    booking_id
                ]
            );

            console.log(
                "CASH PAYMENT FARE RESTORED:",
                {
                    booking_id,
                    distance_km: distanceKm,
                    base_fare: baseFare,
                    discount: discount,
                    final_fare: finalFare
                }
            );
        }

        // ----------------------------------------------------
        // MARK PAYMENT AS PAID
        // ----------------------------------------------------

        await db.query(
            `
            UPDATE bookings
            SET
                payment_status = 'paid',
                payment_method = 'cash'
            WHERE id = ?
            `,
            [booking_id]
        );

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            message:
                "Cash payment completed successfully.",

            booking_id:
                booking.id,

            final_fare:
                finalFare,

            payment_method:
                "cash",

            payment_status:
                "paid"
        });

    } catch (error) {

        console.error(
            "COMPLETE CASH PAYMENT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to complete cash payment.",

            error:
                error.message
        });
    }
};


// ============================================================
// EXPORT ALL CONTROLLERS
// ============================================================

module.exports = {
    bookRide,
    requestRide,
    getMyBookings,
    getAcceptedRide,
    calculateFare,
    updatePaymentMethod,
    completeCashPayment
};