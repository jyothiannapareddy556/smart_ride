const db = require("../config/db");

// =====================================================
// GET PENDING / ACTIVE RIDES
// =====================================================

const getPendingRides = async (req, res) => {
  try {
    const riderId = Number(req.query.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rides } = await db.query(
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
    console.error(
      "GET PENDING RIDES ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch ride requests",
      error: error.message,
    });
  }
};

// =====================================================
// ACCEPT RIDE
// =====================================================

const acceptRide = async (req, res) => {
  const client = await db.connect();

  try {
    const bookingId = Number(req.params.id);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) { client.release(); return res.status(400).json({ message: "Booking ID and rider ID are required" }); }
    await client.query("BEGIN");

    const riderResult = await client.query(`SELECT id, name, phone, role, availability, current_location FROM users WHERE id = $1 FOR UPDATE`, [riderId]);
    if (riderResult.rows.length === 0) { await client.query("ROLLBACK"); client.release(); return res.status(404).json({ message: "Rider not found" }); }
    const rider = riderResult.rows[0];
    if (rider.role !== "rider") { await client.query("ROLLBACK"); client.release(); return res.status(403).json({ message: "User is not a rider" }); }
    if (rider.availability !== "available") { await client.query("ROLLBACK"); client.release(); return res.status(409).json({ message: "Rider is not currently available" }); }

    const bookingResult = await client.query(`SELECT id, passenger_id, rider_id, status, pickup_location, drop_location FROM bookings WHERE id = $1 FOR UPDATE`, [bookingId]);
    if (bookingResult.rows.length === 0) { await client.query("ROLLBACK"); client.release(); return res.status(404).json({ message: "Ride request not found" }); }
    const booking = bookingResult.rows[0];
    if (booking.status !== "pending") { await client.query("ROLLBACK"); client.release(); return res.status(400).json({ message: "This ride is no longer available" }); }

    const updateResult = await client.query(`UPDATE bookings SET rider_id = $1, status = 'accepted' WHERE id = $2 AND status = 'pending'`, [riderId, bookingId]);
    if (updateResult.rowCount === 0) { await client.query("ROLLBACK"); client.release(); return res.status(409).json({ message: "Ride was already accepted by another rider" }); }
    await client.query(`UPDATE users SET availability = 'busy' WHERE id = $1`, [riderId]);
    await client.query("COMMIT");
    client.release();

    return res.status(200).json({ message: "Ride accepted successfully", ride: { id: bookingId, rider_id: riderId, passenger_id: booking.passenger_id, status: "accepted", pickup_location: booking.pickup_location, drop_location: booking.drop_location } });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    client.release();
    console.error("ACCEPT RIDE ERROR:", error);
    return res.status(500).json({ message: "Failed to accept ride", error: error.message });
  }
};

// =====================================================
// REJECT RIDE
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

    const { bookings } = await db.query(
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
        message:
          "This ride request cannot be rejected now",
      });
    }

    /*
     * For a pending request there may not yet be
     * a rider_id assigned.
     *
     * We therefore record the rejection by changing
     * the booking status.
     */

    const result = await db.query(
      `
      UPDATE bookings

      SET
        status = 'rejected'

      WHERE
        id = $1
        AND status = 'pending'
      `,
      [bookingId]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message:
          "Ride request was already updated",
      });
    }

    return res.status(200).json({
      message: "Ride request rejected",
    });

  } catch (error) {
    console.error(
      "REJECT RIDE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to reject ride",
      error: error.message,
    });
  }
};

// =====================================================
// START RIDE
// =====================================================

const startRide = async (req, res) => {
  try {
    const bookingId =
      Number(req.params.bookingId);

    const riderId =
      Number(req.body.rider_id);

    if (!bookingId || !riderId) {
      return res.status(400).json({
        message: "Booking ID and rider ID are required",
      });
    }

    const { bookings } = await db.query(
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

    if (
      Number(booking.rider_id) !==
      riderId
    ) {
      return res.status(403).json({
        message:
          "This ride does not belong to this rider",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        message:
          "Only an accepted ride can be started",
      });
    }

    const result = await db.query(
      `
      UPDATE bookings

      SET
        status = 'ongoing'

      WHERE
        id = $1
        AND rider_id = $2
        AND status = 'accepted'
      `,
      [bookingId, riderId]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        message:
          "Unable to start the ride",
      });
    }

    return res.status(200).json({
      message: "Ride started successfully",
    });

  } catch (error) {
    console.error(
      "START RIDE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to start ride",
      error: error.message,
    });
  }
};

// =====================================================
// COMPLETE RIDE
// =====================================================

const completeRide = async (req, res) => {
  const client = await db.connect();

  try {
    const bookingId = Number(req.params.bookingId);
    const riderId = Number(req.body.rider_id);

    if (!bookingId || !riderId) { client.release(); return res.status(400).json({ message: "Booking ID and rider ID are required" }); }
    await client.query("BEGIN");

    const bookingResult = await client.query(`SELECT id, rider_id, status FROM bookings WHERE id = $1 FOR UPDATE`, [bookingId]);
    if (bookingResult.rows.length === 0) { await client.query("ROLLBACK"); client.release(); return res.status(404).json({ message: "Ride not found" }); }
    const booking = bookingResult.rows[0];
    if (Number(booking.rider_id) !== riderId || booking.status !== "ongoing") { await client.query("ROLLBACK"); client.release(); return res.status(400).json({ message: "Only an ongoing ride assigned to this rider can be completed" }); }

    const updateResult = await client.query(`UPDATE bookings SET status = 'completed' WHERE id = $1 AND rider_id = $2 AND status = 'ongoing'`, [bookingId, riderId]);
    if (updateResult.rowCount === 0) { await client.query("ROLLBACK"); client.release(); return res.status(409).json({ message: "Ride was already updated" }); }
    await client.query(`UPDATE users SET availability = 'available' WHERE id = $1`, [riderId]);
    await client.query("COMMIT");
    client.release();

    return res.status(200).json({ message: "Ride completed successfully" });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    client.release();
    console.error("COMPLETE RIDE ERROR:", error);
    return res.status(500).json({ message: "Failed to complete ride", error: error.message });
  }
};

// =====================================================
// UPDATE RIDER GPS LOCATION
// =====================================================

const updateLocation = async (req, res) => {
  try {
    const riderId =
      Number(req.body.rider_id);

    const currentLocation =
      req.body.current_location;

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    if (!currentLocation) {
      return res.status(400).json({
        message:
          "Current location is required",
      });
    }

    const { riders } = await db.query(
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
        message:
          "Only riders can update rider location",
      });
    }

    await db.query(
      `
      UPDATE users

      SET
        current_location = $1

      WHERE id = $2
      `,
      [
        currentLocation,
        riderId,
      ]
    );

    return res.status(200).json({
      message:
        "Location updated successfully",

      current_location:
        currentLocation,
    });

  } catch (error) {
    console.error(
      "UPDATE LOCATION ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update rider location",
      error: error.message,
    });
  }
};
// =====================================================
// GO ONLINE
// =====================================================
const goOnline = async (req, res) => {
  try {
    const riderId = Number(req.body.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { riders } = await db.query(
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
        message: "Only riders can go online",
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
// =====================================================

const goOffline = async (req, res) => {
  try {
    const riderId =
      Number(req.body.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { riders } = await db.query(
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
        message:
          "Only riders can go offline",
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
    });

  } catch (error) {
    console.error(
      "GO OFFLINE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to go offline",
      error: error.message,
    });
  }
};

// =====================================================
// GET RIDER RIDE HISTORY
// =====================================================

const getRideHistory = async (req, res) => {
  try {
    const riderId =
      Number(req.params.rider_id);

    if (!riderId) {
      return res.status(400).json({
        message: "Rider ID is required",
      });
    }

    const { rides } = await db.query(
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

        u.name AS passenger_name,
        u.phone AS passenger_phone

      FROM bookings b

      JOIN users u
        ON b.passenger_id = u.id

      WHERE
        b.rider_id = $1

      ORDER BY
        b.booking_date DESC
      `,
      [riderId]
    );

    // -------------------------------------------------
    // CALCULATE EARNINGS
    //
    // If your bookings table already contains
    // final_fare, distance_km, payment_method, or
    // payment_status, those fields can be added here.
    // -------------------------------------------------

    let totalEarnings = 0;

    rides.forEach((ride) => {
      if (ride.final_fare) {
        totalEarnings +=
          Number(ride.final_fare);
      }
    });

    const completedRides =
      rides.filter(
        (ride) =>
          ride.status === "completed"
      ).length;

    return res.status(200).json({
      rides,
      totalEarnings,
      completedRides,
    });

  } catch (error) {
    console.error(
      "GET RIDER HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch rider history",
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