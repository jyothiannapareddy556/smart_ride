const db = require("../config/db");

// =====================================================
// GET PENDING / ACTIVE RIDES
// GET /api/rider/pending?rider_id=14
// =====================================================

const getPendingRides = async (req, res) => {
  try {
    const riderId = Number(req.query.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rows: rides } = await db.query(
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
        b.distance_km,
        b.base_fare,
        b.discount,
        b.final_fare,
        b.payment_method,
        b.payment_status,

        u.name AS passenger_name,
        u.phone AS passenger_phone

      FROM bookings b

      JOIN users u
        ON b.passenger_id = u.id

      WHERE
        (
          b.status = 'pending'
          OR
          (
            b.status IN ('accepted', 'ongoing')
            AND b.rider_id = $1
          )
        )

      ORDER BY b.booking_date DESC
      `,
      [riderId]
    );

    return res.status(200).json(rides);

  } catch (error) {
    console.error("GET PENDING RIDES ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch ride requests",
      error: error.message,
    });
  }
};

// =====================================================
// ACCEPT RIDE
// PUT /api/rider/accept/:id
// Body: { rider_id: 14 }
// =====================================================

const acceptRide = async (req, res) => {
  const client = await db.connect();

  try {
    const bookingId = Number(req.params.id);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) {
      client.release();

      return res.status(400).json({
        message: "Booking ID and rider ID are required",
      });
    }

    await client.query("BEGIN");

    // -------------------------------------------------
    // CHECK RIDER
    // -------------------------------------------------

    const riderResult = await client.query(
      `
      SELECT
        id,
        name,
        phone,
        role,
        availability,
        current_location

      FROM users

      WHERE id = $1

      FOR UPDATE
      `,
      [riderId]
    );

    if (riderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(404).json({
        message: "Rider not found",
      });
    }

    const rider = riderResult.rows[0];

    if (rider.role !== "rider") {
      await client.query("ROLLBACK");
      client.release();

      return res.status(403).json({
        message: "User is not a rider",
      });
    }

    if (rider.availability !== "available") {
      await client.query("ROLLBACK");
      client.release();

      return res.status(409).json({
        message: "Rider is not currently available",
      });
    }

    // -------------------------------------------------
    // CHECK BOOKING
    // -------------------------------------------------

    const bookingResult = await client.query(
      `
      SELECT
        id,
        passenger_id,
        rider_id,
        status,
        pickup_location,
        drop_location,
        passengers,
        distance_km,
        base_fare,
        discount,
        final_fare,
        payment_method,
        payment_status

      FROM bookings

      WHERE id = $1

      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(404).json({
        message: "Ride request not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "pending") {
      await client.query("ROLLBACK");
      client.release();

      return res.status(400).json({
        message: "This ride is no longer available",
      });
    }

    // -------------------------------------------------
    // ACCEPT BOOKING
    // -------------------------------------------------

    const updateResult = await client.query(
      `
      UPDATE bookings

      SET
        rider_id = $1,
        status = 'accepted'

      WHERE
        id = $2
        AND status = 'pending'
      `,
      [riderId, bookingId]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(409).json({
        message: "Ride was already accepted by another rider",
      });
    }

    // -------------------------------------------------
    // MAKE RIDER BUSY
    // -------------------------------------------------

    await client.query(
      `
      UPDATE users

      SET availability = 'busy'

      WHERE id = $1
      `,
      [riderId]
    );

    await client.query("COMMIT");
    client.release();

    return res.status(200).json({
      message: "Ride accepted successfully",

      ride: {
        id: bookingId,
        rider_id: riderId,
        passenger_id: booking.passenger_id,
        status: "accepted",

        pickup_location: booking.pickup_location,
        drop_location: booking.drop_location,

        passengers: booking.passengers,
        distance_km: booking.distance_km,

        base_fare: booking.base_fare,
        discount: booking.discount,
        final_fare: booking.final_fare,

        payment_method: booking.payment_method,
        payment_status: booking.payment_status,

        rider_name: rider.name,
        rider_phone: rider.phone,
        current_location: rider.current_location,
      },
    });

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    client.release();

    console.error("ACCEPT RIDE ERROR:", error);

    return res.status(500).json({
      message: "Failed to accept ride",
      error: error.message,
    });
  }
};

// =====================================================
// REJECT RIDE
// PUT /api/rider/reject/:id
// Body: { rider_id: 14 }
// =====================================================

const rejectRide = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) {
      return res.status(400).json({
        message: "Booking ID and rider ID are required",
      });
    }

    const { rows: bookings } = await db.query(
      `
      SELECT
        id,
        rider_id,
        status

      FROM bookings

      WHERE id = $1
      `,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        message: "Ride request not found",
      });
    }

    const booking = bookings[0];

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "This ride request cannot be rejected now",
      });
    }

    const result = await db.query(
      `
      UPDATE bookings

      SET status = 'rejected'

      WHERE
        id = $1
        AND status = 'pending'
      `,
      [bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message: "Ride request was already updated",
      });
    }

    return res.status(200).json({
      message: "Ride request rejected",
    });

  } catch (error) {
    console.error("REJECT RIDE ERROR:", error);

    return res.status(500).json({
      message: "Failed to reject ride",
      error: error.message,
    });
  }
};

// =====================================================
// START RIDE
// PUT /api/rider/start/:bookingId
// Body: { rider_id: 14 }
// =====================================================

const startRide = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) {
      return res.status(400).json({
        message: "Booking ID and rider ID are required",
      });
    }

    const { rows: bookings } = await db.query(
      `
      SELECT
        id,
        rider_id,
        status

      FROM bookings

      WHERE id = $1
      `,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const booking = bookings[0];

    if (Number(booking.rider_id) !== riderId) {
      return res.status(403).json({
        message: "This ride does not belong to this rider",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        message: "Only an accepted ride can be started",
      });
    }

    const result = await db.query(
      `
      UPDATE bookings

      SET status = 'ongoing'

      WHERE
        id = $1
        AND rider_id = $2
        AND status = 'accepted'
      `,
      [bookingId, riderId]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message: "Unable to start the ride",
      });
    }

    return res.status(200).json({
      message: "Ride started successfully",
      status: "ongoing",
    });

  } catch (error) {
    console.error("START RIDE ERROR:", error);

    return res.status(500).json({
      message: "Failed to start ride",
      error: error.message,
    });
  }
};

// =====================================================
// COMPLETE RIDE
// PUT /api/rider/complete/:bookingId
// Body: { rider_id: 14 }
// =====================================================

const completeRide = async (req, res) => {
  const client = await db.connect();

  try {
    const bookingId = Number(req.params.bookingId);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) {
      client.release();

      return res.status(400).json({
        message: "Booking ID and rider ID are required",
      });
    }

    await client.query("BEGIN");

    const bookingResult = await client.query(
      `
      SELECT
        id,
        rider_id,
        status

      FROM bookings

      WHERE id = $1

      FOR UPDATE
      `,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(404).json({
        message: "Ride not found",
      });
    }

    const booking = bookingResult.rows[0];

    if (
      Number(booking.rider_id) !== riderId ||
      booking.status !== "ongoing"
    ) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(400).json({
        message:
          "Only an ongoing ride assigned to this rider can be completed",
      });
    }

    const updateResult = await client.query(
      `
      UPDATE bookings

      SET status = 'completed'

      WHERE
        id = $1
        AND rider_id = $2
        AND status = 'ongoing'
      `,
      [bookingId, riderId]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();

      return res.status(409).json({
        message: "Ride was already updated",
      });
    }

    // Rider becomes available again
    await client.query(
      `
      UPDATE users

      SET availability = 'available'

      WHERE id = $1
      `,
      [riderId]
    );

    await client.query("COMMIT");
    client.release();

    return res.status(200).json({
      message: "Ride completed successfully",
      status: "completed",
    });

  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    client.release();

    console.error("COMPLETE RIDE ERROR:", error);

    return res.status(500).json({
      message: "Failed to complete ride",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE RIDER GPS LOCATION
// PUT /api/rider/location
// Body:
// {
//   rider_id: 14,
//   current_location: "..."
// }
// =====================================================

const updateLocation = async (req, res) => {
  try {
    const riderId = Number(req.body.rider_id);
    const currentLocation = req.body.current_location;

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    if (!currentLocation) {
      return res.status(400).json({
        message: "Current location is required",
      });
    }

    const { rows: riders } = await db.query(
      `
      SELECT
        id,
        role

      FROM users

      WHERE id = $1
      `,
      [riderId]
    );

    if (riders.length === 0) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    if (riders[0].role !== "rider") {
      return res.status(403).json({
        message: "Only riders can update rider location",
      });
    }

    await db.query(
      `
      UPDATE users

      SET current_location = $1

      WHERE id = $2
      `,
      [currentLocation, riderId]
    );

    return res.status(200).json({
      message: "Location updated successfully",
      current_location: currentLocation,
    });

  } catch (error) {
    console.error("UPDATE LOCATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to update rider location",
      error: error.message,
    });
  }
};

// =====================================================
// GO ONLINE
// PUT /api/rider/online
// =====================================================

const goOnline = async (req, res) => {
  try {
    const riderId = Number(req.body.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rows: riders } = await db.query(
      `
      SELECT
        id,
        role,
        availability

      FROM users

      WHERE id = $1
      `,
      [riderId]
    );

    if (riders.length === 0) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    if (riders[0].role !== "rider") {
      return res.status(403).json({
        message: "Only riders can go online",
      });
    }

    if (riders[0].availability === "busy") {
      return res.status(409).json({
        message: "Complete your current ride before going online",
      });
    }

    await db.query(
      `
      UPDATE users

      SET availability = 'available'

      WHERE id = $1
      `,
      [riderId]
    );

    return res.status(200).json({
      message: "You are now online",
      availability: "available",
    });

  } catch (error) {
    console.error("GO ONLINE ERROR:", error);

    return res.status(500).json({
      message: "Failed to go online",
      error: error.message,
    });
  }
};

// =====================================================
// GO OFFLINE
// PUT /api/rider/offline
// =====================================================

const goOffline = async (req, res) => {
  try {
    const riderId = Number(req.body.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rows: riders } = await db.query(
      `
      SELECT
        id,
        role,
        availability

      FROM users

      WHERE id = $1
      `,
      [riderId]
    );

    if (riders.length === 0) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    if (riders[0].role !== "rider") {
      return res.status(403).json({
        message: "Only riders can go offline",
      });
    }

    if (riders[0].availability === "busy") {
      return res.status(409).json({
        message: "You cannot go offline during an active ride",
      });
    }

    await db.query(
      `
      UPDATE users

      SET
        availability = 'offline',
        current_location = NULL

      WHERE id = $1
      `,
      [riderId]
    );

    return res.status(200).json({
      message: "You are now offline",
      availability: "offline",
    });

  } catch (error) {
    console.error("GO OFFLINE ERROR:", error);

    return res.status(500).json({
      message: "Failed to go offline",
      error: error.message,
    });
  }
};

// =====================================================
// GET RIDER RIDE HISTORY
// GET /api/rider/history/:rider_id
// =====================================================

const getRideHistory = async (req, res) => {
  try {
    const riderId = Number(req.params.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rows: rides } = await db.query(
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

        b.distance_km,
        b.base_fare,
        b.discount,
        b.final_fare,

        b.payment_method,
        b.payment_status,

        u.name AS passenger_name,
        u.phone AS passenger_phone

      FROM bookings b

      JOIN users u
        ON b.passenger_id = u.id

      WHERE b.rider_id = $1

      ORDER BY b.booking_date DESC
      `,
      [riderId]
    );

    // -------------------------------------------------
    // CALCULATE EARNINGS
    // -------------------------------------------------

    let totalEarnings = 0;

    rides.forEach((ride) => {
      if (
        ride.status === "completed" &&
        ride.final_fare !== null &&
        ride.final_fare !== undefined
      ) {
        totalEarnings += Number(ride.final_fare);
      }
    });

    const completedRides = rides.filter(
      (ride) => ride.status === "completed"
    ).length;

    return res.status(200).json({
      rides,
      totalEarnings,
      completedRides,
    });

  } catch (error) {
    console.error("GET RIDER HISTORY ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch rider history",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getPendingRides,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  updateLocation,
  goOnline,
  goOffline,
  getRideHistory,
};