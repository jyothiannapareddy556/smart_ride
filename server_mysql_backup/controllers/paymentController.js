const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../config/db");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER
|--------------------------------------------------------------------------
*/
const createPaymentOrder = async (req, res) => {
    try {
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({
                message: "Booking ID is required",
            });
        }

        // ------------------------------------------------------------
        // GET BOOKING
        // ------------------------------------------------------------

        const [rows] = await db.query(
            `
            SELECT
                id,
                passenger_id,
                status,
                distance_km,
                base_fare,
                discount,
                final_fare,
                payment_status
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        const booking = rows[0];

        // ------------------------------------------------------------
        // PAYMENT ONLY AFTER RIDE COMPLETION
        // ------------------------------------------------------------

        if (booking.status !== "completed") {
            return res.status(400).json({
                message:
                    "Payment is available only after ride completion",
            });
        }

        // ------------------------------------------------------------
        // PREVENT DOUBLE PAYMENT
        // ------------------------------------------------------------

        if (booking.payment_status === "paid") {
            return res.status(400).json({
                message: "This booking has already been paid",
            });
        }

        // ------------------------------------------------------------
        // RESTORE FARE IF FINAL FARE IS MISSING
        // ------------------------------------------------------------

        let finalFare = Number(booking.final_fare);

        if (!finalFare || finalFare <= 0) {

            const distanceKm = Number(booking.distance_km);

            if (!distanceKm || distanceKm <= 0) {
                return res.status(400).json({
                    message:
                        "Valid fare is not available for this booking",
                });
            }

            // RideBack fare rules
            // ₹10.60 per KM
            // 20% RideBack discount

            const baseFare =
                Number((distanceKm * 10.60).toFixed(2));

            const discount =
                Number((baseFare * 0.20).toFixed(2));

            finalFare =
                Number((baseFare - discount).toFixed(2));

            // --------------------------------------------------------
            // SAVE RESTORED FARE
            // --------------------------------------------------------

            await db.query(
                `
                UPDATE bookings
                SET
                    base_fare = ?,
                    discount = ?,
                    final_fare = ?
                WHERE id = ?
                `,
                [
                    baseFare,
                    discount,
                    finalFare,
                    booking_id,
                ]
            );

            console.log(
                `FARE RESTORED: Booking #${booking_id} | ` +
                `Distance: ${distanceKm} KM | ` +
                `Base: ₹${baseFare} | ` +
                `Discount: ₹${discount} | ` +
                `Final: ₹${finalFare}`
            );
        }

        // ------------------------------------------------------------
        // CONVERT RUPEES TO PAISE
        // ------------------------------------------------------------

        const amountInPaise = Math.round(
            finalFare * 100
        );

        if (!amountInPaise || amountInPaise <= 0) {
            return res.status(400).json({
                message:
                    "Unable to create payment order for this fare",
            });
        }

        // ------------------------------------------------------------
        // CREATE RAZORPAY ORDER
        // ------------------------------------------------------------

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rideback_${booking_id}`,
            notes: {
                booking_id: String(booking_id),
                passenger_id: String(booking.passenger_id),
            },
        };

        console.log(
            "CREATING RAZORPAY ORDER:",
            {
                booking_id,
                amount: amountInPaise,
                fare: finalFare,
            }
        );

        const order = await razorpay.orders.create(options);

        // ------------------------------------------------------------
        // SAVE ORDER ID
        // ------------------------------------------------------------

        await db.query(
            `
            UPDATE bookings
            SET razorpay_order_id = ?
            WHERE id = ?
            `,
            [order.id, booking_id]
        );

        // ------------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------------

        return res.status(200).json({
            message: "Payment order created successfully",

            order_id: order.id,

            amount: order.amount,

            currency: order.currency,

            key_id: process.env.RAZORPAY_KEY_ID,

            booking_id: booking_id,

            final_fare: finalFare,
        });

    } catch (error) {
        console.error(
            "CREATE PAYMENT ORDER ERROR:",
            error
        );

        return res.status(500).json({
            message: "Failed to create payment order",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| VERIFY RAZORPAY PAYMENT
|--------------------------------------------------------------------------
*/
const verifyPayment = async (req, res) => {
    try {
        const {
            booking_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !booking_id ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message:
                    "Payment verification details are required",
            });
        }

        // ------------------------------------------------------------
        // GET BOOKING
        // ------------------------------------------------------------

        const [rows] = await db.query(
            `
            SELECT
                id,
                passenger_id,
                status,
                final_fare,
                payment_status,
                razorpay_order_id
            FROM bookings
            WHERE id = ?
            `,
            [booking_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        const booking = rows[0];

        // ------------------------------------------------------------
        // PAYMENT ONLY AFTER COMPLETION
        // ------------------------------------------------------------

        if (booking.status !== "completed") {
            return res.status(400).json({
                message:
                    "Payment can only be verified after ride completion",
            });
        }

        // ------------------------------------------------------------
        // CHECK ORDER ID
        // ------------------------------------------------------------

        if (
            !booking.razorpay_order_id ||
            booking.razorpay_order_id !== razorpay_order_id
        ) {
            return res.status(400).json({
                message:
                    "Payment order does not match booking",
            });
        }

        // ------------------------------------------------------------
        // PREVENT DOUBLE PAYMENT
        // ------------------------------------------------------------

        if (booking.payment_status === "paid") {
            return res.status(400).json({
                message:
                    "This booking has already been paid",
            });
        }

        // ------------------------------------------------------------
        // GENERATE SIGNATURE
        // ------------------------------------------------------------

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        // ------------------------------------------------------------
        // TIMING-SAFE SIGNATURE COMPARISON
        // ------------------------------------------------------------

        const generatedBuffer =
            Buffer.from(generatedSignature, "utf8");

        const receivedBuffer =
            Buffer.from(razorpay_signature, "utf8");

        if (
            generatedBuffer.length !==
            receivedBuffer.length
        ) {
            return res.status(400).json({
                message:
                    "Payment verification failed",
            });
        }

        const isValid =
            crypto.timingSafeEqual(
                generatedBuffer,
                receivedBuffer
            );

        if (!isValid) {
            return res.status(400).json({
                message:
                    "Payment verification failed",
            });
        }

        // ------------------------------------------------------------
        // PAYMENT VERIFIED
        // ------------------------------------------------------------

        await db.query(
            `
            UPDATE bookings
            SET
                payment_method = 'online',
                payment_status = 'paid',
                razorpay_payment_id = ?,
                razorpay_signature = ?,
                paid_at = NOW()
            WHERE id = ?
            `,
            [
                razorpay_payment_id,
                razorpay_signature,
                booking_id,
            ]
        );

        // ------------------------------------------------------------
        // RESPONSE
        // ------------------------------------------------------------

        return res.status(200).json({
            message:
                "Payment verified successfully",

            payment_status:
                "paid",

            payment_method:
                "online",

            booking_id:
                booking_id,

            payment_id:
                razorpay_payment_id,

            amount:
                booking.final_fare,
        });

    } catch (error) {
        console.error(
            "VERIFY PAYMENT ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Payment verification failed",

            error:
                error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLERS
|--------------------------------------------------------------------------
*/

module.exports = {
    createPaymentOrder,
    verifyPayment,
};