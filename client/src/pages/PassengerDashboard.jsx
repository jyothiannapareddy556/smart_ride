import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import PassengerMap from "../components/PassengerMap";

const PassengerDashboard = () => {
    const navigate = useNavigate();

    // ============================================================
    // USER
    // ============================================================

    const [user, setUser] = useState(null);

    // ============================================================
    // BOOKING
    // ============================================================

    const [pickup, setPickup] = useState("");
    const [drop, setDrop] = useState("");
    const [passengers, setPassengers] = useState(1);
    const [bookingId, setBookingId] = useState(null);

    // ============================================================
    // RIDERS
    // ============================================================

    const [availableRiders, setAvailableRiders] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [selectedRider, setSelectedRider] = useState(null);
    const [requestingRider, setRequestingRider] = useState(false);

    // ============================================================
    // ACCEPTED RIDE
    // ============================================================

    const [acceptedRide, setAcceptedRide] = useState(null);

    // ============================================================
    // FARE
    // ============================================================

    const [distance, setDistance] = useState("");
    const [fare, setFare] = useState(null);
    const [calculatingFare, setCalculatingFare] = useState(false);

    // ============================================================
    // PAYMENT
    // ============================================================

    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("pending");
    const [paymentLoading, setPaymentLoading] = useState(false);
    // ============================================================
// PROFESSIONAL NOTIFICATION
// ============================================================

const [notification, setNotification] = useState({
    show: false,
    type: "info",
    title: "",
    message: ""
});

const showNotification = (
    typeOrMessage,
    title = "",
    message = "",
    duration = 4000
) => {
    // Supports both:
    // showNotification("Simple message")
    //
    // and:
    // showNotification("success", "Success", "Payment completed")

    let type = "info";
    let notificationTitle = title;
    let notificationMessage = message;

    if (
        message === "" &&
        title === ""
    ) {
        notificationMessage = typeOrMessage;
        notificationTitle = "RideBack";
    } else {
        type = typeOrMessage;
    }

    setNotification({
        show: true,
        type,
        title: notificationTitle,
        message: notificationMessage
    });

    setTimeout(() => {
        setNotification((previous) => ({
            ...previous,
            show: false
        }));
    }, duration);
};

const closeNotification = () => {
    setNotification((previous) => ({
        ...previous,
        show: false
    }));
};
    // ============================================================
    // TOAST
    // ============================================================

    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);

    const showToast = (message, type = "success", title) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        const titles = {
            success: "Success",
            error: "Something went wrong",
            warning: "Please check",
            info: "RideBack Update",
        };

        setToast({
            id: Date.now(),
            message,
            type,
            title: title || titles[type] || "RideBack",
        });

        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 4200);
    };

    const closeToast = () => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        setToast(null);
    };

    // ============================================================
    // LOAD USER
    // ============================================================

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        console.log("STORED USER:", storedUser);

        if (!storedUser) {
            navigate("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);

            const passengerId =
                parsedUser.id ||
                parsedUser.user_id ||
                parsedUser.passenger_id;

            if (!passengerId) {
                console.error(
                    "PASSENGER ID NOT FOUND:",
                    parsedUser
                );

                localStorage.removeItem("user");
                localStorage.removeItem("token");

                navigate("/login");
                return;
            }

            const normalizedUser = {
                ...parsedUser,
                id: passengerId,
            };

            console.log(
                "NORMALIZED PASSENGER:",
                normalizedUser
            );

            setUser(normalizedUser);
        } catch (error) {
            console.error(
                "USER DATA ERROR:",
                error
            );

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            navigate("/login");
        }
    }, [navigate]);

    // ============================================================
    // CLEANUP TOAST
    // ============================================================

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    // ============================================================
    // CHECK ACCEPTED RIDE
    // ============================================================

    // ============================================================
// CHECK RIDE STATUS
// ============================================================
useEffect(() => {
    if (!user) return;

    const checkRideStatus = async () => {
        try {
            // ----------------------------------------------------
            // FIRST: CHECK ACTIVE RIDE
            // ----------------------------------------------------
            try {
                const response = await api.get(
                    `/rides/accepted/${user.id}`
                );

                if (response.data) {
                    const ride = Array.isArray(response.data)
                        ? response.data[0]
                        : response.data;

                    if (ride) {
                        console.log(
                            "ACTIVE RIDE:",
                            ride
                        );

                        setAcceptedRide(ride);

                        const currentBookingId =
                            ride.booking_id || ride.id;

                        setBookingId(currentBookingId);

                        // Save current booking so we don't lose it
                        // if the dashboard refreshes.
                        localStorage.setItem(
                            "rideback_current_booking_id",
                            String(currentBookingId)
                        );

                        if (
                            ride.distance_km !== null &&
                            ride.distance_km !== undefined
                        ) {
                            setDistance(
                                ride.distance_km
                            );
                        }

                        if (
                            ride.final_fare !== null &&
                            ride.final_fare !== undefined
                        ) {
                            setFare({
                                distance_km:
                                    ride.distance_km,
                                base_fare:
                                    ride.base_fare,
                                discount:
                                    ride.discount,
                                final_fare:
                                    ride.final_fare,
                            });
                        }

                        if (ride.payment_method) {
                            setPaymentMethod(
                                ride.payment_method
                            );
                        }

                        if (ride.payment_status) {
                            setPaymentStatus(
                                ride.payment_status
                            );
                        }
                    }
                }
            } catch (activeError) {
                // 404 is expected after rider completes the ride.
                if (
                    activeError.response?.status !== 404
                ) {
                    console.error(
                        "ACTIVE RIDE ERROR:",
                        activeError.response?.data ||
                            activeError.message
                    );
                }
            }

            // ----------------------------------------------------
            // SECOND: CHECK RIDE HISTORY
            // ----------------------------------------------------
            const historyResponse = await api.get(
                `/rides/history/${user.id}`
            );

            const history = Array.isArray(
                historyResponse.data
            )
                ? historyResponse.data
                : [];

            // Get current booking ID.
            let currentBookingId = bookingId;

            if (!currentBookingId) {
                const savedBookingId =
                    localStorage.getItem(
                        "rideback_current_booking_id"
                    );

                if (savedBookingId) {
                    currentBookingId =
                        Number(savedBookingId);
                }
            }

            if (!currentBookingId) {
                return;
            }

            // Find ONLY the current booking.
            const currentRide = history.find(
                (ride) =>
                    Number(
                        ride.booking_id || ride.id
                    ) === Number(currentBookingId)
            );

            if (!currentRide) {
                return;
            }

            console.log(
                "CURRENT BOOKING FROM HISTORY:",
                currentRide
            );

            // ----------------------------------------------------
            // RIDER COMPLETED THE RIDE
            // ----------------------------------------------------
            if (
                currentRide.status ===
                "completed"
            ) {
                console.log(
                    "✅ RIDE COMPLETED:",
                    currentRide
                );

                setAcceptedRide(currentRide);

                setBookingId(
                    currentBookingId
                );

                if (
                    currentRide.distance_km !==
                        null &&
                    currentRide.distance_km !==
                        undefined
                ) {
                    setDistance(
                        currentRide.distance_km
                    );
                }

                if (
                    currentRide.final_fare !==
                        null &&
                    currentRide.final_fare !==
                        undefined
                ) {
                    setFare({
                        distance_km:
                            currentRide.distance_km,
                        base_fare:
                            currentRide.base_fare,
                        discount:
                            currentRide.discount,
                        final_fare:
                            currentRide.final_fare,
                    });
                }

                if (
                    currentRide.payment_method
                ) {
                    setPaymentMethod(
                        currentRide.payment_method
                    );
                }

                if (
                    currentRide.payment_status
                ) {
                    setPaymentStatus(
                        currentRide.payment_status
                    );
                }
            }
        } catch (error) {
            console.error(
                "RIDE STATUS CHECK ERROR:",
                error.response?.data ||
                    error.message
            );
        }
    };

    // Check immediately.
    checkRideStatus();

    // Check every 5 seconds.
    const interval = setInterval(
        checkRideStatus,
        5000
    );

    return () => {
        clearInterval(interval);
    };
}, [user, bookingId]);

    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);

        navigate("/login");
    };

    // ============================================================
    // GEOCODING
    // ============================================================

    const geocodeLocation = async (location) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
                    location
                )}`
            );

            const data = await response.json();

            if (!data || data.length === 0) {
                return null;
            }

            return {
                latitude: Number(data[0].lat),
                longitude: Number(data[0].lon),
            };
        } catch (error) {
            console.error(
                "GEOCODING ERROR:",
                error
            );

            return null;
        }
    };

    // ============================================================
    // ROUTE DISTANCE
    // ============================================================

   const calculateRouteDistance = async (
    pickupLat,
    pickupLng,
    dropLat,
    dropLng
) => {
    try {
        if (
            pickupLat == null ||
            pickupLng == null ||
            dropLat == null ||
            dropLng == null
        ) {
            console.error(
                "ROAD DISTANCE ERROR: Coordinates are missing."
            );

            return null;
        }

        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${pickupLng},${pickupLat};` +
            `${dropLng},${dropLat}` +
            `?overview=false`;

        console.log(
            "OSRM ROUTE REQUEST:",
            url
        );

        const response =
            await fetch(url);

        if (!response.ok) {
            console.error(
                "OSRM HTTP ERROR:",
                response.status
            );

            return null;
        }

        const data =
            await response.json();

        if (
            !data.routes ||
            !data.routes.length
        ) {
            console.error(
                "OSRM: No route found."
            );

            return null;
        }

        const distanceKm =
            Number(
                data.routes[0].distance / 1000
            ).toFixed(2);

        console.log(
            "OSRM ROAD DISTANCE:",
            distanceKm,
            "KM"
        );

        return distanceKm;

    } catch (error) {

        console.error(
            "ROUTE DISTANCE ERROR:",
            error
        );

        return null;
    }
};
    

    // ============================================================
    // FIND RIDERS
    // ============================================================

    const handleFindRiders = async (e) => {
        if (e) {
            e.preventDefault();
        }

        if (!pickup.trim()) {
            showToast(
                "Please enter pickup location.",
                "warning"
            );
            return;
        }

        if (!drop.trim()) {
            showToast(
                "Please enter destination.",
                "warning"
            );
            return;
        }

        if (
            !passengers ||
            Number(passengers) < 1
        ) {
            showToast(
                "Number of passengers must be at least 1.",
                "warning"
            );
            return;
        }

        if (!user?.id) {
            showToast(
                "Passenger information not found. Please login again.",
                "error"
            );

            navigate("/login");
            return;
        }

        const passengerId =
            user.id ||
            user.user_id ||
            user.passenger_id;

        try {
            setLoadingRiders(true);
            setAvailableRiders([]);
            setSelectedRider(null);
            setAcceptedRide(null);
            setBookingId(null);
            setFare(null);
            setDistance("");
            setPaymentMethod("");
            setPaymentStatus("pending");

            showToast(
                "Finding riders near your route...",
                "info",
                "Finding Riders"
            );

            // --------------------------------------------------------
// GEOCODE PICKUP AND DESTINATION
// --------------------------------------------------------

const pickupCoords =
    await geocodeLocation(
        pickup.trim()
    );

const dropCoords =
    await geocodeLocation(
        drop.trim()
    );

if (!pickupCoords) {
    showNotification(
        "Could not find the pickup location. Please enter a more specific location."
    );

    return;
}

if (!dropCoords) {
    showNotification(
        "Could not find the destination. Please enter a more specific location."
    );

    return;
}

console.log(
    "PICKUP COORDINATES:",
    pickupCoords
);

console.log(
    "DROP COORDINATES:",
    dropCoords
);

// --------------------------------------------------------
// BOOK RIDE WITH COORDINATES
// --------------------------------------------------------



// ----------------------------------------------------
// BOOK RIDE WITH COORDINATES
// ----------------------------------------------------

const response = await api.post(
    "/rides/book",
    {
        passenger_id: passengerId,

        pickup_location:
            pickup.trim(),

        drop_location:
            drop.trim(),

        passengers:
            Number(passengers),

        pickup_lat:
            pickupCoords.latitude,

        pickup_lng:
            pickupCoords.longitude,

        drop_lat:
            dropCoords.latitude,

        drop_lng:
            dropCoords.longitude
    }
);

            console.log(
                "BOOK RIDE RESPONSE:",
                response.data
            );

            const newBookingId =
                response.data.booking_id;

            setBookingId(
                newBookingId
            );

            if (
                response.data.distance_km
            ) {
                setDistance(
                    response.data.distance_km
                );
            }

            // Save the current booking ID so the passenger
            // can continue tracking the same ride.
            localStorage.setItem(
                "rideback_current_booking_id",
                String(newBookingId)
            );

            const riders =
                Array.isArray(
                    response.data.riders
                )
                    ? response.data.riders
                    : [];

            const onlineRiders =
                riders.filter(
                    (rider) =>
                        rider.availability ===
                        "available"
                );

            setAvailableRiders(
                onlineRiders
            );

            if (
                onlineRiders.length === 0
            ) {
                showToast(
                    "Your ride request was created, but no riders are currently online.",
                    "warning",
                    "No Riders Available"
                );
            } else {
                showToast(
                    `${onlineRiders.length} rider${
                        onlineRiders.length !== 1
                            ? "s"
                            : ""
                    } found for your ride.`,
                    "success",
                    "Riders Found"
                );
            }
        } catch (error) {
            console.error(
                "FIND RIDERS ERROR:",
                error
            );

            if (error.response) {
                showToast(
                    error.response.data?.message ||
                        "Failed to find riders.",
                    "error"
                );
            } else if (error.request) {
                showToast(
                    "Cannot connect to server. Make sure the backend is running on port 5000.",
                    "error"
                );
            } else {
                showToast(
                    error.message ||
                        "Failed to find riders.",
                    "error"
                );
            }
        } finally {
            setLoadingRiders(false);
        }
    };

    // ============================================================
    // REQUEST PARTICULAR RIDER
    // ============================================================

    const handleRequestRider = async (
        rider
    ) => {
        if (!bookingId) {
            showToast(
                "Booking ID not found. Please find riders again.",
                "error"
            );
            return;
        }

        if (!rider?.id) {
            showToast(
                "Rider ID not found.",
                "error"
            );
            return;
        }

        try {
            setRequestingRider(true);
            setSelectedRider(rider);

            const response =
                await api.post(
                    "/rides/request",
                    {
                        booking_id:
                            bookingId,

                        rider_id:
                            rider.id,
                    }
                );

            console.log(
                "REQUEST RIDER RESPONSE:",
                response.data
            );

            showToast(
                response.data.message ||
                    "Ride request sent successfully!",
                "success",
                "Request Sent"
            );
        } catch (error) {
            console.error(
                "REQUEST RIDER ERROR:",
                error
            );

            setSelectedRider(null);

            showToast(
                error.response?.data?.message ||
                    "Failed to request rider.",
                "error"
            );
        } finally {
            setRequestingRider(false);
        }
    };

    // ============================================================
    // CALCULATE FARE
    // ============================================================

    const calculateFare = async (
        distanceValue
    ) => {
        if (
            !bookingId ||
            !distanceValue ||
            Number(distanceValue) <= 0
        ) {
            return;
        }

        try {
            setCalculatingFare(true);

            const response =
                await api.post(
                    "/rides/calculate-fare",
                    {
                        booking_id:
                            bookingId,

                        distance_km:
                            Number(
                                distanceValue
                            ),

                        passengers:
                            Number(
                                passengers
                            ) || 1,
                    }
                );

            console.log(
                "FARE RESPONSE:",
                response.data
            );

            setFare(
                response.data
            );

            setPaymentMethod(
                response.data.payment_method ||
                    ""
            );

            setPaymentStatus(
                response.data.payment_status ||
                    "pending"
            );
        } catch (error) {
            console.error(
                "FARE ERROR:",
                error
            );
        } finally {
            setCalculatingFare(false);
        }
    };






// ============================================================
// AUTOMATIC FARE WHEN ACCEPTED
// ============================================================

useEffect(() => {
    if (
        !acceptedRide ||
        !bookingId ||
        fare ||
        calculatingFare
    ) {
        return;
    }

    const restoreFare = async () => {
        try {
            let roadDistance =
                acceptedRide.distance_km;

            // ------------------------------------------------
            // CASE 1:
            // DATABASE ALREADY HAS DISTANCE
            // ------------------------------------------------

            if (
                roadDistance &&
                Number(roadDistance) > 0
            ) {
                console.log(
                    "USING DATABASE ROAD DISTANCE:",
                    roadDistance,
                    "KM"
                );

                setDistance(
                    Number(roadDistance)
                );
            }

            // ------------------------------------------------
            // CASE 2:
            // DATABASE DISTANCE IS MISSING
            // USE STORED COORDINATES
            // ------------------------------------------------

            else {

                console.log(
                    "DATABASE DISTANCE NOT AVAILABLE."
                );

                console.log(
                    "CALCULATING ROAD DISTANCE USING STORED COORDINATES..."
                );

                setCalculatingFare(true);

                roadDistance =
                    await calculateRouteDistance(
                        acceptedRide.pickup_lat,
                        acceptedRide.pickup_lng,
                        acceptedRide.drop_lat,
                        acceptedRide.drop_lng
                    );

                if (
                    !roadDistance ||
                    Number(roadDistance) <= 0
                ) {
                    showToast(
                        "Unable to calculate road distance. Please try again.",
                        "error"
                    );

                    return;
                }

                console.log(
                    "RESTORED ROAD DISTANCE:",
                    roadDistance,
                    "KM"
                );

                setDistance(
                    Number(roadDistance)
                );
            }

            // ------------------------------------------------
            // SAVE FARE TO DATABASE
            // ------------------------------------------------

            await calculateFare(
                roadDistance
            );

        } catch (error) {

            console.error(
                "RESTORE FARE ERROR:",
                error
            );

            showToast(
                "Unable to calculate ride fare.",
                "error"
            );

        } finally {
            setCalculatingFare(false);
        }
    };

    restoreFare();

}, [
    acceptedRide,
    bookingId,
    fare,
    calculatingFare
]);
    // ============================================================
    // SELECT PAYMENT METHOD
    // ============================================================

    const handlePaymentMethod = async (
        method
    ) => {
        if (!bookingId) {
            showToast(
                "Booking ID not found.",
                "error"
            );
            return;
        }

        try {
            setPaymentLoading(true);

            const response =
                await api.put(
                    "/rides/payment-method",
                    {
                        booking_id:
                            bookingId,

                        payment_method:
                            method,
                    }
                );

            console.log(
                "PAYMENT RESPONSE:",
                response.data
            );

            setPaymentMethod(
                response.data.payment_method
            );

            setPaymentStatus(
                response.data.payment_status ||
                    "pending"
            );

            showToast(
                `${method === "cash" ? "Cash" : "Online"} payment selected.`,
                "success",
                "Payment Method"
            );
        } catch (error) {
            console.error(
                "PAYMENT METHOD ERROR:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to select payment method.",
                "error"
            );
        } finally {
            setPaymentLoading(false);
        }
    };

    // ============================================================
    // COMPLETE CASH PAYMENT
    // ============================================================

    const handleCashPayment = async () => {
        if (!bookingId) {
            showToast(
                "Booking ID not found.",
                "error"
            );
            return;
        }

        try {
            setPaymentLoading(true);

            console.log("CASH PAYMENT BOOKING ID:", bookingId);
            console.log("CASH PAYMENT FARE:", fare);

            const response =
                await api.put(
                    "/rides/cash-payment",
                    {
                        booking_id:
                            bookingId,
                    }
                );

            console.log(
                "CASH PAYMENT:",
                response.data
            );

            setPaymentStatus("paid");
            setPaymentMethod("cash");

            showToast(
                response.data.message ||
                    "Cash payment completed successfully.",
                "success",
                "Payment Completed"
            );
        } catch (error) {
            console.error(
                "CASH PAYMENT ERROR:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to complete payment.",
                "error"
            );
        } finally {
            setPaymentLoading(false);
        }
    };
    // ============================================================
// RAZORPAY ONLINE / UPI PAYMENT
// ============================================================

const handleOnlinePayment = async () => {
    if (!bookingId) {
        showNotification("Booking ID not found.");
        return;
    }

    if (!fare || !fare.final_fare) {
        showNotification("Fare has not been calculated yet.");
        return;
    }

    try {
        setPaymentLoading(true);

        // ----------------------------------------------------
        // LOAD RAZORPAY CHECKOUT SCRIPT
        // ----------------------------------------------------

        const loadRazorpayScript = () => {
            return new Promise((resolve) => {
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }

                const script = document.createElement("script");

                script.src =
                    "https://checkout.razorpay.com/v1/checkout.js";

                script.onload = () => {
                    resolve(true);
                };

                script.onerror = () => {
                    resolve(false);
                };

                document.body.appendChild(script);
            });
        };

        const razorpayLoaded =
            await loadRazorpayScript();

        if (!razorpayLoaded) {
            showNotification(
                "Unable to load Razorpay. Please check your internet connection."
            );

            setPaymentLoading(false);
            return;
        }

        // ----------------------------------------------------
        // CREATE RAZORPAY ORDER
        // ----------------------------------------------------

        const orderResponse = await api.post(
            "/payment/create-order",
            {
                booking_id: bookingId
            }
        );

        console.log(
            "RAZORPAY ORDER RESPONSE:",
            orderResponse.data
        );

        const {
            order_id,
            amount,
            currency,
            key_id
        } = orderResponse.data;

        if (!order_id || !key_id) {
            throw new Error(
                "Invalid Razorpay order response."
            );
        }

        // ----------------------------------------------------
        // RAZORPAY CHECKOUT OPTIONS
        // ----------------------------------------------------

        const options = {
            key: key_id,

            amount: amount,

            currency: currency || "INR",

            name: "RideBack",

            description:
                `RideBack Ride Payment - Booking #${bookingId}`,

            order_id: order_id,

            prefill: {
                name: user?.name || "",
                email: user?.email || "",
                contact: user?.phone || ""
            },

            notes: {
                booking_id: String(bookingId)
            },

            theme: {
                color: "#16a34a"
            },

            handler: async function (
                response
            ) {
                try {
                    console.log(
                        "RAZORPAY PAYMENT RESPONSE:",
                        response
                    );

                    // ------------------------------------------------
                    // VERIFY PAYMENT ON OUR SERVER
                    // ------------------------------------------------

                    const verifyResponse =
                        await api.post(
                            "/payment/verify",
                            {
                                booking_id:
                                    bookingId,

                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature
                            }
                        );

                    console.log(
                        "PAYMENT VERIFICATION:",
                        verifyResponse.data
                    );

                    // ------------------------------------------------
                    // UPDATE UI
                    // ------------------------------------------------

                    setPaymentStatus("paid");

                    setPaymentMethod("online");

                    setFare((previous) => ({
                        ...previous,
                        payment_status: "paid",
                        payment_method: "online"
                    }));

                    showNotification(
                        "Payment completed successfully! 🎉"
                    );

                } catch (error) {
                    console.error(
                        "PAYMENT VERIFICATION ERROR:",
                        error
                    );

                    showNotification(
                        error.response?.data?.message ||
                        "Payment verification failed."
                    );
                } finally {
                    setPaymentLoading(false);
                }
            },

            modal: {
                ondismiss: function () {
                    console.log(
                        "Razorpay checkout closed."
                    );

                    setPaymentLoading(false);
                }
            }
        };

        // ----------------------------------------------------
        // OPEN RAZORPAY CHECKOUT
        // ----------------------------------------------------

        const razorpay =
            new window.Razorpay(options);

        // Payment failure event
        razorpay.on(
            "payment.failed",
            function (response) {
                console.error(
                    "RAZORPAY PAYMENT FAILED:",
                    response
                );

                setPaymentStatus("failed");

                showNotification(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );

                setPaymentLoading(false);
            }
        );

        razorpay.open();

    } catch (error) {
        console.error(
            "ONLINE PAYMENT ERROR:",
            error
        );

        showNotification(
            error.response?.data?.message ||
            error.message ||
            "Unable to start online payment."
        );

        setPaymentLoading(false);
    }
};

    // ============================================================
    // LOADING
    // ============================================================

    if (!user) {
        return (
            <div className="rb-loading-page">
                <style>{`
                    .rb-loading-page {
                        min-height:100vh;
                        display:grid;
                        place-items:center;
                        background:linear-gradient(
                            135deg,
                            #ecfdf5,
                            #f8fafc
                        );
                        padding:20px;
                        font-family:Inter,ui-sans-serif,system-ui,sans-serif;
                    }

                    .rb-loader-card {
                        text-align:center;
                        background:white;
                        border-radius:24px;
                        padding:35px;
                        box-shadow:0 20px 50px rgba(15,23,42,.10);
                    }

                    .rb-spinner {
                        width:48px;
                        height:48px;
                        border:4px solid #d1fae5;
                        border-top-color:#059669;
                        border-radius:50%;
                        animation:rbSpin .8s linear infinite;
                        margin:0 auto 18px;
                    }

                    @keyframes rbSpin {
                        to {
                            transform:rotate(360deg);
                        }
                    }

                    .rb-loader-card h3 {
                        margin:0;
                        font-weight:900;
                    }

                    .rb-loader-card p {
                        color:#64748b;
                        font-size:13px;
                        margin:6px 0 0;
                    }
                `}</style>

                <div className="rb-loader-card">
                    <div className="rb-spinner" />

                    <h3>
                        Preparing your passenger dashboard
                    </h3>

                    <p>
                        Connecting your RideBack account...
                    </p>
                </div>
            </div>
        );
    }

    const firstLetter =
        user.name
            ?.charAt(0)
            ?.toUpperCase() ||
        "P";

    const pendingRequest =
        selectedRider &&
        !acceptedRide;

    const activeRide =
        acceptedRide &&
        (
            acceptedRide.status ===
                "accepted" ||
            acceptedRide.status ===
                "ongoing"
        );

    return (
        <div className="rb-page">

            {/* =====================================================
                RIDER DASHBOARD THEME
            ===================================================== */}

            <style>{`

                * {
                    box-sizing:border-box;
                }

                .rb-page {
                    min-height:100vh;
                    color:#102033;
                    background:
                        radial-gradient(
                            circle at 15% 10%,
                            rgba(16,185,129,.12),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 90% 20%,
                            rgba(14,165,233,.10),
                            transparent 25%
                        ),
                        linear-gradient(
                            135deg,
                            #f5faf8 0%,
                            #eef5f7 45%,
                            #f8fafc 100%
                        );

                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                /* TOP BAR */

                .rb-topbar {
                    position:sticky;
                    top:0;
                    z-index:30;
                    backdrop-filter:blur(18px);
                    background:rgba(255,255,255,.86);
                    border-bottom:
                        1px solid rgba(148,163,184,.18);
                    box-shadow:
                        0 8px 30px rgba(15,23,42,.06);
                }

                .rb-topbar-inner {
                    max-width:1450px;
                    margin:auto;
                    min-height:82px;
                    padding:14px 28px;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:20px;
                }

                .rb-brand {
                    display:flex;
                    align-items:center;
                    gap:12px;
                }

                .rb-brand-logo {
                    width:48px;
                    height:48px;
                    border-radius:16px;
                    display:grid;
                    place-items:center;
                    background:
                        linear-gradient(
                            135deg,
                            #059669,
                            #0f766e
                        );
                    color:white;
                    font-size:25px;
                    box-shadow:
                        0 12px 25px rgba(5,150,105,.28);
                }

                .rb-brand h1 {
                    margin:0;
                    font-size:20px;
                    font-weight:900;
                    letter-spacing:-.5px;
                }

                .rb-brand p {
                    margin:2px 0 0;
                    color:#64748b;
                    font-size:12px;
                    font-weight:700;
                }

                .rb-userbar {
                    display:flex;
                    align-items:center;
                    gap:12px;
                }

                .rb-avatar {
                    width:42px;
                    height:42px;
                    border-radius:50%;
                    display:grid;
                    place-items:center;
                    color:white;
                    font-weight:900;
                    background:
                        linear-gradient(
                            135deg,
                            #0f766e,
                            #059669
                        );
                    box-shadow:
                        0 7px 18px rgba(5,150,105,.22);
                }

                .rb-user-name {
                    font-weight:850;
                    font-size:14px;
                }

                .rb-user-role {
                    color:#64748b;
                    font-size:11px;
                    margin-top:1px;
                }

                .rb-logout {
                    border:0;
                    background:#fff1f2;
                    color:#dc2626;
                    padding:10px 15px;
                    border-radius:12px;
                    font-weight:800;
                    cursor:pointer;
                    transition:.2s;
                }

                .rb-logout:hover {
                    background:#dc2626;
                    color:white;
                    transform:translateY(-1px);
                }

                /* LAYOUT */

                .rb-layout {
                    display:grid;
                    grid-template-columns:
                        245px
                        minmax(0,1fr);

                    max-width:1500px;
                    margin:auto;
                }

                .rb-sidebar {
                    min-height:
                        calc(100vh - 82px);

                    padding:26px 18px;

                    position:sticky;
                    top:82px;
                    align-self:start;
                }

                .rb-sidebar-card {
                    background:
                        rgba(15,23,42,.96);

                    border-radius:26px;
                    padding:18px;

                    box-shadow:
                        0 22px 45px rgba(15,23,42,.18);

                    color:white;
                }

                .rb-side-label {
                    color:#64748b;
                    text-transform:uppercase;
                    letter-spacing:1.3px;
                    font-size:10px;
                    font-weight:900;
                    padding:8px 10px;
                }

                .rb-side-btn {
                    width:100%;
                    display:flex;
                    align-items:center;
                    gap:11px;
                    border:0;
                    background:transparent;
                    color:#94a3b8;
                    padding:12px;
                    border-radius:13px;
                    font-weight:800;
                    cursor:pointer;
                    text-align:left;
                    margin-top:5px;
                    transition:.2s;
                }

                .rb-side-btn:hover,
                .rb-side-btn.active {
                    background:#064e3b;
                    color:white;
                    box-shadow:
                        inset 0 0 0 1px
                        rgba(52,211,153,.15);
                }

                .rb-side-profile {
                    margin-top:25px;
                    padding-top:18px;
                    border-top:
                        1px solid #1e293b;

                    display:flex;
                    gap:10px;
                    align-items:center;
                }

                .rb-side-avatar {
                    width:38px;
                    height:38px;
                    border-radius:50%;
                    display:grid;
                    place-items:center;
                    background:#059669;
                    font-weight:900;
                }

                .rb-side-profile strong {
                    display:block;
                    font-size:13px;
                }

                .rb-side-profile span {
                    color:#64748b;
                    font-size:11px;
                }

                .rb-main {
                    min-width:0;
                    padding:28px 30px 50px;
                }

                .rb-container {
                    max-width:1180px;
                    margin:auto;
                }

                /* HERO */

                .rb-hero {
                    position:relative;
                    overflow:hidden;
                    border-radius:30px;
                    padding:34px;

                    background:
                        linear-gradient(
                            135deg,
                            #064e3b 0%,
                            #047857 46%,
                            #0f766e 100%
                        );

                    color:white;

                    box-shadow:
                        0 25px 55px rgba(4,120,87,.22);

                    margin-bottom:25px;
                }

                .rb-hero:before {
                    content:"";
                    position:absolute;
                    width:320px;
                    height:320px;
                    border-radius:50%;
                    right:-90px;
                    top:-150px;
                    background:
                        rgba(255,255,255,.08);
                }

                .rb-hero:after {
                    content:"🚕";
                    position:absolute;
                    right:48px;
                    bottom:-24px;
                    font-size:145px;
                    opacity:.15;
                    transform:rotate(-8deg);
                }

                .rb-hero-grid {
                    position:relative;
                    z-index:1;

                    display:flex;
                    justify-content:space-between;
                    gap:30px;
                    align-items:center;
                }

                .rb-eyebrow {
                    color:#a7f3d0;
                    text-transform:uppercase;
                    letter-spacing:1.5px;
                    font-size:11px;
                    font-weight:900;
                }

                .rb-hero h2 {
                    margin:8px 0 0;
                    font-size:
                        clamp(30px,4vw,48px);

                    line-height:1.03;
                    letter-spacing:-1.7px;
                    font-weight:950;
                }

                .rb-hero p {
                    max-width:650px;
                    color:#d1fae5;
                    margin:14px 0 0;
                    line-height:1.65;
                    font-size:14px;
                }

                .rb-booking-summary {
                    width:270px;
                    flex:0 0 270px;

                    background:
                        rgba(255,255,255,.11);

                    border:
                        1px solid
                        rgba(255,255,255,.15);

                    backdrop-filter:blur(16px);

                    border-radius:22px;
                    padding:20px;

                    box-shadow:
                        inset 0 1px
                        rgba(255,255,255,.12);
                }

                .rb-booking-summary small {
                    color:#a7f3d0;
                    font-weight:700;
                }

                .rb-booking-summary-value {
                    margin-top:8px;
                    font-size:22px;
                    font-weight:950;
                }

                .rb-booking-summary-text {
                    margin-top:7px;
                    color:#d1fae5;
                    font-size:12px;
                    line-height:1.5;
                }

                /* STATS */

                .rb-stats {
                    display:grid;
                    grid-template-columns:
                        repeat(3,1fr);

                    gap:16px;
                    margin-bottom:25px;
                }

                .rb-stat {
                    background:
                        rgba(255,255,255,.88);

                    border:
                        1px solid
                        rgba(226,232,240,.75);

                    border-radius:22px;
                    padding:21px;

                    box-shadow:
                        0 14px 35px
                        rgba(15,23,42,.07);

                    position:relative;
                    overflow:hidden;
                }

                .rb-stat:after {
                    content:"";
                    position:absolute;
                    width:100px;
                    height:100px;
                    border-radius:50%;
                    right:-40px;
                    top:-45px;
                    background:
                        rgba(16,185,129,.07);
                }

                .rb-stat-label {
                    color:#64748b;
                    font-size:12px;
                    font-weight:800;
                }

                .rb-stat-value {
                    font-size:34px;
                    font-weight:950;
                    letter-spacing:-1px;
                    margin-top:6px;
                }

                .rb-stat-icon {
                    position:absolute;
                    right:18px;
                    bottom:17px;
                    font-size:28px;
                }

                /* SECTIONS */

                .rb-section {
                    margin-top:30px;
                }

                .rb-section-head {
                    display:flex;
                    align-items:flex-end;
                    justify-content:space-between;
                    gap:15px;
                    margin-bottom:14px;
                }

                .rb-section-kicker {
                    color:#059669;
                    font-size:11px;
                    letter-spacing:1.2px;
                    font-weight:950;
                }

                .rb-section h2 {
                    margin:3px 0 0;
                    font-size:25px;
                    letter-spacing:-.7px;
                    font-weight:950;
                }

                .rb-card {
                    background:
                        rgba(255,255,255,.92);

                    border:
                        1px solid
                        rgba(226,232,240,.75);

                    border-radius:25px;

                    box-shadow:
                        0 15px 40px
                        rgba(15,23,42,.07);
                }

                /* BOOKING */

                .rb-booking-card {
                    padding:25px;
                }

                .rb-input-grid {
                    display:grid;
                    grid-template-columns:
                        1fr 1fr;

                    gap:16px;
                }

                .rb-input-group label {
                    display:block;
                    color:#64748b;
                    font-size:11px;
                    font-weight:900;
                    letter-spacing:.7px;
                    text-transform:uppercase;
                    margin-bottom:7px;
                }

                .rb-input-wrap {
                    display:flex;
                    align-items:center;
                    gap:10px;

                    background:#f8fafc;

                    border:
                        1px solid #e2e8f0;

                    border-radius:15px;

                    padding:0 14px;

                    transition:.2s;
                }

                .rb-input-wrap:focus-within {
                    border-color:#10b981;
                    box-shadow:
                        0 0 0 4px
                        rgba(16,185,129,.08);
                }

                .rb-input-wrap span {
                    font-size:17px;
                }

                .rb-input-wrap input {
                    width:100%;
                    border:0;
                    outline:0;
                    background:transparent;
                    padding:14px 0;
                    font-size:14px;
                    color:#0f172a;
                }

                .rb-passenger-row {
                    margin-top:16px;

                    display:grid;

                    grid-template-columns:
                        190px 1fr;

                    gap:16px;
                    align-items:end;
                }

                .rb-find-btn {
                    width:100%;
                    min-height:49px;

                    border:0;
                    border-radius:14px;

                    background:
                        linear-gradient(
                            135deg,
                            #059669,
                            #047857
                        );

                    color:white;

                    font-weight:900;
                    cursor:pointer;

                    box-shadow:
                        0 12px 25px
                        rgba(5,150,105,.20);

                    transition:.2s;
                }

                .rb-find-btn:hover:not(:disabled) {
                    transform:translateY(-2px);
                }

                .rb-find-btn:disabled {
                    opacity:.55;
                    cursor:not-allowed;
                }

                /* RIDER CARDS */

                .rb-rider-card {
                    padding:22px;
                    margin-bottom:14px;

                    display:flex;
                    align-items:center;
                    gap:16px;

                    transition:.25s;
                }

                .rb-rider-card:hover {
                    transform:translateY(-3px);
                    box-shadow:
                        0 24px 55px
                        rgba(15,23,42,.11);
                }

                .rb-rider-avatar {
                    width:58px;
                    height:58px;
                    flex:0 0 58px;

                    border-radius:18px;

                    display:grid;
                    place-items:center;

                    color:#047857;
                    font-size:23px;
                    font-weight:950;

                    background:
                        linear-gradient(
                            135deg,
                            #d1fae5,
                            #ccfbf1
                        );
                }

                .rb-rider-info {
                    flex:1;
                    min-width:0;
                }

                .rb-rider-info h3 {
                    margin:0;
                    font-size:18px;
                    font-weight:950;
                }

                .rb-rider-info p {
                    margin:5px 0 0;
                    color:#64748b;
                    font-size:12px;
                }

                .rb-online-badge {
                    display:inline-flex;
                    margin-top:8px;
                    padding:6px 9px;
                    border-radius:999px;
                    background:#ecfdf5;
                    color:#047857;
                    font-size:10px;
                    font-weight:950;
                }

                .rb-request-btn {
                    border:0;
                    border-radius:13px;
                    padding:12px 16px;

                    background:
                        linear-gradient(
                            135deg,
                            #059669,
                            #047857
                        );

                    color:white;

                    font-weight:900;
                    cursor:pointer;

                    transition:.2s;
                }

                .rb-request-btn:hover {
                    transform:translateY(-2px);
                }

                .rb-request-btn.sent {
                    background:#0f172a;
                }

                .rb-request-btn:disabled {
                    opacity:.6;
                    cursor:not-allowed;
                }

                /* EMPTY */

                .rb-empty {
                    padding:45px 22px;
                    text-align:center;
                }

                .rb-empty-icon {
                    font-size:54px;
                }

                .rb-empty h3 {
                    margin:12px 0 0;
                    font-size:20px;
                    font-weight:950;
                }

                .rb-empty p {
                    color:#94a3b8;
                    max-width:520px;
                    margin:7px auto 0;
                    line-height:1.55;
                }

                .rb-retry {
                    margin-top:18px;
                    border:0;
                    border-radius:13px;
                    padding:12px 18px;
                    background:#ecfdf5;
                    color:#047857;
                    font-weight:900;
                    cursor:pointer;
                }

                /* WAITING */

                .rb-waiting {
                    padding:22px;
                    display:flex;
                    align-items:center;
                    gap:16px;

                    background:
                        linear-gradient(
                            135deg,
                            #ecfdf5,
                            #f0fdfa
                        );

                    border:
                        1px solid #bbf7d0;
                }

                .rb-wait-icon {
                    width:55px;
                    height:55px;
                    border-radius:17px;

                    display:grid;
                    place-items:center;

                    background:white;
                    font-size:25px;

                    box-shadow:
                        0 10px 25px
                        rgba(15,23,42,.06);
                }

                .rb-waiting h3 {
                    margin:0;
                    font-size:18px;
                    font-weight:950;
                }

                .rb-waiting p {
                    margin:5px 0 0;
                    color:#64748b;
                    font-size:13px;
                }

                /* ACCEPTED RIDE */

                .rb-accepted {
                    padding:25px;
                }

                .rb-accepted-header {
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:20px;
                }

                .rb-accepted-badge {
                    display:inline-flex;
                    padding:7px 11px;
                    border-radius:999px;

                    background:#ecfdf5;
                    color:#047857;

                    font-size:10px;
                    font-weight:950;
                    letter-spacing:.5px;
                }

                .rb-accepted h2 {
                    margin:9px 0 0;
                    font-size:28px;
                }

                .rb-accepted-subtitle {
                    color:#64748b;
                    font-size:13px;
                    margin-top:6px;
                }

                .rb-big-icon {
                    width:65px;
                    height:65px;
                    border-radius:20px;

                    display:grid;
                    place-items:center;

                    background:
                        linear-gradient(
                            135deg,
                            #ecfdf5,
                            #d1fae5
                        );

                    font-size:34px;
                }

                .rb-ride-details {
                    margin-top:22px;

                    display:grid;

                    grid-template-columns:
                        .9fr 1.1fr;

                    gap:18px;
                }

                .rb-rider-profile {
                    padding:20px;

                    border-radius:20px;
                    background:#f8fafc;
                    border:1px solid #eef2f7;

                    display:flex;
                    align-items:center;
                    gap:14px;
                }

                .rb-large-avatar {
                    width:60px;
                    height:60px;
                    border-radius:19px;

                    display:grid;
                    place-items:center;

                    background:
                        linear-gradient(
                            135deg,
                            #d1fae5,
                            #ccfbf1
                        );

                    color:#047857;
                    font-size:24px;
                    font-weight:950;
                }

                .rb-rider-profile small {
                    color:#94a3b8;
                    font-size:10px;
                    font-weight:900;
                    letter-spacing:.8px;
                }

                .rb-rider-profile h3 {
                    margin:3px 0;
                    font-size:19px;
                    font-weight:950;
                }

                .rb-rider-profile p {
                    margin:0;
                    color:#64748b;
                    font-size:12px;
                }

                .rb-route-box {
                    padding:20px;

                    border-radius:20px;

                    background:#f8fafc;
                    border:1px solid #eef2f7;
                }

                .rb-route-point {
                    display:flex;
                    gap:13px;
                    align-items:flex-start;
                }

                .rb-route-dot {
                    width:12px;
                    height:12px;
                    border-radius:50%;
                    flex:0 0 12px;
                    margin-top:3px;
                }

                .rb-green {
                    background:#22c55e;
                }

                .rb-red {
                    background:#ef4444;
                }

                .rb-route-point small {
                    display:block;
                    color:#94a3b8;
                    font-size:10px;
                    font-weight:900;
                    letter-spacing:.8px;
                }

                .rb-route-point strong {
                    display:block;
                    margin-top:4px;
                    line-height:1.45;
                    font-size:13px;
                }

                .rb-route-divider {
                    width:2px;
                    height:28px;
                    margin-left:5px;
                    background:#cbd5e1;
                }

                /* MAP */

                .rb-map-section {
                    margin-top:20px;
                }

                .rb-map-heading {
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                    margin-bottom:10px;
                }

                .rb-map-heading h3 {
                    margin:0;
                    font-size:17px;
                    font-weight:950;
                }

                .rb-map-heading p {
                    margin:4px 0 0;
                    color:#64748b;
                    font-size:12px;
                }

                .rb-live-badge {
                    padding:7px 10px;
                    border-radius:999px;
                    background:#ecfdf5;
                    color:#059669;
                    font-size:10px;
                    font-weight:950;
                }

                .rb-map-wrap {
                    border-radius:20px;
                    overflow:hidden;
                    border:1px solid #e2e8f0;
                    box-shadow:
                        0 10px 25px
                        rgba(15,23,42,.06);
                }

                /* STATUS */

                .rb-status-bar {
                    margin-top:17px;
                    padding:15px 17px;

                    border-radius:16px;

                    background:#eff6ff;
                    border:1px solid #bfdbfe;

                    display:flex;
                    align-items:center;
                    justify-content:space-between;

                    color:#1d4ed8;
                }

                .rb-status-bar strong {
                    text-transform:capitalize;
                    font-size:14px;
                }

                /* FARE */

                .rb-fare {
                    margin-top:18px;
                    padding:20px;

                    border-radius:20px;

                    background:
                        linear-gradient(
                            135deg,
                            #f8fafc,
                            #f1f5f9
                        );

                    border:
                        1px solid #e2e8f0;
                }

                .rb-fare-head {
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                }

                .rb-fare h3 {
                    margin:0;
                    font-size:17px;
                    font-weight:950;
                }

                .rb-fare p {
                    margin:5px 0 0;
                    color:#64748b;
                    font-size:12px;
                }

                .rb-calculating {
                    color:#059669;
                    font-size:11px;
                    font-weight:900;
                }

                .rb-distance {
                    margin-top:16px;
                    padding:14px;
                    border-radius:15px;
                    background:white;
                    border:1px solid #e2e8f0;
                }

                .rb-distance label {
                    display:block;
                    color:#64748b;
                    font-size:10px;
                    font-weight:900;
                    text-transform:uppercase;
                }

                .rb-distance-value {
                    margin-top:7px;
                    font-size:22px;
                    font-weight:950;
                    color:#047857;
                }

                .rb-fare-result {
                    margin-top:15px;
                    background:white;
                    border-radius:17px;
                    border:1px solid #e2e8f0;
                    overflow:hidden;
                }

                .rb-fare-row {
                    display:flex;
                    justify-content:space-between;
                    padding:12px 15px;
                    border-bottom:1px solid #eef2f7;
                    font-size:13px;
                }

                .rb-fare-row span:first-child {
                    color:#64748b;
                }

                .rb-discount {
                    color:#059669;
                }

                .rb-fare-total {
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:16px;
                    background:#ecfdf5;
                }

                .rb-fare-total strong {
                    font-size:24px;
                    color:#047857;
                    font-weight:950;
                }

                /* PAYMENT */

                .rb-payment {
                    margin-top:18px;
                    padding:20px;

                    border-radius:20px;
                    background:white;
                    border:1px solid #e2e8f0;
                }

                .rb-payment h3 {
                    margin:0;
                    font-size:17px;
                    font-weight:950;
                }

                .rb-payment > p {
                    color:#64748b;
                    font-size:12px;
                    margin:5px 0 15px;
                }

                .rb-payment-options {
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:12px;
                }

                .rb-payment-btn {
                    border:1px solid #e2e8f0;
                    background:#f8fafc;
                    border-radius:16px;
                    padding:15px;

                    display:flex;
                    align-items:center;
                    gap:12px;

                    cursor:pointer;
                    text-align:left;

                    transition:.2s;
                }

                .rb-payment-btn:hover {
                    border-color:#10b981;
                    transform:translateY(-1px);
                }

                .rb-payment-btn.selected {
                    border-color:#10b981;
                    background:#ecfdf5;
                    box-shadow:
                        0 0 0 3px
                        rgba(16,185,129,.08);
                }

                .rb-payment-icon {
                    width:42px;
                    height:42px;
                    border-radius:13px;
                    display:grid;
                    place-items:center;
                    background:white;
                    font-size:20px;
                }

                .rb-payment-btn strong {
                    display:block;
                    font-size:14px;
                }

                .rb-payment-btn small {
                    color:#64748b;
                    font-size:11px;
                }

                .rb-payment-check {
                    margin-left:auto;
                    color:#059669;
                    font-weight:950;
                }

                .rb-cash-box {
                    margin-top:15px;
                    padding:17px;

                    border-radius:16px;

                    background:#fffbeb;
                    border:1px solid #fde68a;

                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:15px;
                }

                .rb-cash-box h4 {
                    margin:0;
                    font-size:14px;
                    font-weight:950;
                }

                .rb-cash-box p {
                    margin:5px 0 0;
                    color:#92400e;
                    font-size:12px;
                }

                .rb-pay-btn {
                    border:0;
                    border-radius:12px;
                    padding:11px 15px;

                    background:#059669;
                    color:white;

                    font-weight:900;
                    cursor:pointer;
                }

                .rb-pay-btn:disabled {
                    opacity:.55;
                    cursor:not-allowed;
                }

                .rb-online-box {
                    margin-top:15px;
                    padding:18px;

                    border-radius:16px;

                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                }

                .rb-online-box h4 {
                    margin:0;
                    font-weight:950;
                }

                .rb-online-amount {
                    margin:8px 0;
                    font-size:27px;
                    font-weight:950;
                    color:#1d4ed8;
                }

                .rb-online-pay {
                    border:0;
                    border-radius:12px;
                    padding:11px 15px;

                    background:#2563eb;
                    color:white;

                    font-weight:900;
                    cursor:pointer;
                }

                .rb-payment-success {
                    margin-top:15px;

                    display:flex;
                    align-items:center;
                    gap:13px;

                    padding:17px;

                    border-radius:16px;

                    background:#ecfdf5;
                    border:1px solid #bbf7d0;
                }

                .rb-success-icon {
                    width:45px;
                    height:45px;
                    border-radius:50%;

                    display:grid;
                    place-items:center;

                    background:#059669;
                    color:white;

                    font-size:22px;
                    font-weight:950;
                }

                .rb-payment-success h3 {
                    margin:0;
                    color:#047857;
                }

                .rb-payment-success p {
                    margin:4px 0 0;
                    color:#64748b;
                    font-size:12px;
                }

                /* TIP */

                .rb-tip {
                    margin-top:18px;

                    background:
                        linear-gradient(
                            135deg,
                            #ecfdf5,
                            #f0fdfa
                        );

                    border:
                        1px solid #bbf7d0;

                    border-radius:17px;
                    padding:15px;

                    display:flex;
                    gap:12px;
                    align-items:flex-start;

                    color:#065f46;
                    font-size:13px;
                    line-height:1.5;
                }

                /* FOOTER */

                .rb-footer {
                    margin-top:35px;
                    padding:20px 22px;
                    border-radius:22px;

                    background:#0f172a;
                    color:white;

                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;

                    box-shadow:
                        0 20px 45px
                        rgba(15,23,42,.16);
                }

                .rb-footer p {
                    margin:0;
                }

                .rb-footer small {
                    color:#64748b;
                    display:block;
                    margin-top:4px;
                }

                .rb-operational {
                    color:#34d399;
                    font-size:12px;
                    font-weight:800;

                    display:flex;
                    gap:7px;
                    align-items:center;
                }

                .rb-operational i {
                    width:8px;
                    height:8px;
                    background:#34d399;
                    border-radius:50%;
                    box-shadow:
                        0 0 0 5px
                        rgba(52,211,153,.08);
                }

                /* TOAST */

                .rb-toast-layer {
                    position:fixed;
                    top:96px;
                    right:24px;
                    z-index:1000;

                    width:min(
                        390px,
                        calc(100vw - 32px)
                    );

                    pointer-events:none;
                }

                .rb-toast {
                    pointer-events:auto;

                    position:relative;
                    overflow:hidden;

                    display:flex;
                    align-items:flex-start;
                    gap:13px;

                    padding:
                        16px
                        16px
                        17px;

                    border:
                        1px solid
                        rgba(255,255,255,.75);

                    border-radius:18px;

                    background:
                        rgba(255,255,255,.96);

                    backdrop-filter:blur(18px);

                    box-shadow:
                        0 22px 55px
                        rgba(15,23,42,.20),
                        0 3px 10px
                        rgba(15,23,42,.08);

                    animation:
                        rbToastIn
                        .42s
                        cubic-bezier(.2,.8,.2,1);
                }

                .rb-toast.success {
                    border-left:
                        4px solid #10b981;
                }

                .rb-toast.error {
                    border-left:
                        4px solid #ef4444;
                }

                .rb-toast.warning {
                    border-left:
                        4px solid #f59e0b;
                }

                .rb-toast.info {
                    border-left:
                        4px solid #0ea5e9;
                }

                .rb-toast-icon {
                    width:38px;
                    height:38px;
                    flex:0 0 38px;

                    border-radius:12px;

                    display:grid;
                    place-items:center;

                    font-size:18px;
                    font-weight:950;
                }

                .rb-toast.success
                .rb-toast-icon {
                    background:#ecfdf5;
                    color:#059669;
                }

                .rb-toast.error
                .rb-toast-icon {
                    background:#fef2f2;
                    color:#dc2626;
                }

                .rb-toast.warning
                .rb-toast-icon {
                    background:#fffbeb;
                    color:#d97706;
                }

                .rb-toast.info
                .rb-toast-icon {
                    background:#eff6ff;
                    color:#0284c7;
                }

                .rb-toast-content {
                    flex:1;
                    min-width:0;
                    padding-top:1px;
                }

                .rb-toast-title {
                    margin:0;
                    color:#0f172a;
                    font-size:14px;
                    font-weight:950;
                }

                .rb-toast-message {
                    margin:4px 0 0;
                    color:#64748b;
                    font-size:12px;
                    line-height:1.5;
                    font-weight:650;
                }

                .rb-toast-close {
                    border:0;
                    background:transparent;
                    color:#94a3b8;
                    font-size:20px;
                    line-height:1;
                    cursor:pointer;
                    padding:0 2px;
                }

                .rb-toast-close:hover {
                    color:#0f172a;
                }

                .rb-toast-progress {
                    position:absolute;
                    left:0;
                    bottom:0;
                    height:3px;
                    width:100%;
                    transform-origin:left;

                    animation:
                        rbToastProgress
                        4.2s
                        linear
                        forwards;
                }

                .rb-toast.success
                .rb-toast-progress {
                    background:#10b981;
                }

                .rb-toast.error
                .rb-toast-progress {
                    background:#ef4444;
                }

                .rb-toast.warning
                .rb-toast-progress {
                    background:#f59e0b;
                }

                .rb-toast.info
                .rb-toast-progress {
                    background:#0ea5e9;
                }

                @keyframes rbToastIn {
                    from {
                        opacity:0;
                        transform:
                            translate3d(
                                35px,
                                -12px,
                                0
                            )
                            scale(.96);
                    }

                    to {
                        opacity:1;
                        transform:
                            translate3d(
                                0,
                                0,
                                0
                            )
                            scale(1);
                    }
                }

                @keyframes rbToastProgress {
                    from {
                        transform:scaleX(1);
                    }

                    to {
                        transform:scaleX(0);
                    }
                }

                /* RESPONSIVE */

                @media(max-width:1050px) {

                    .rb-layout {
                        grid-template-columns:1fr;
                    }

                    .rb-sidebar {
                        display:none;
                    }

                    .rb-main {
                        padding:22px;
                    }

                    .rb-ride-details {
                        grid-template-columns:1fr;
                    }
                }

                @media(max-width:760px) {

                    .rb-topbar-inner {
                        padding:12px 16px;
                    }

                    .rb-brand p,
                    .rb-user-info {
                        display:none;
                    }

                    .rb-main {
                        padding:16px;
                    }

                    .rb-hero {
                        padding:25px;
                        border-radius:24px;
                    }

                    .rb-hero-grid {
                        display:block;
                    }

                    .rb-hero h2 {
                        font-size:34px;
                    }

                    .rb-hero:after {
                        font-size:100px;
                        right:10px;
                        bottom:-15px;
                    }

                    .rb-booking-summary {
                        width:100%;
                        margin-top:22px;
                    }

                    .rb-stats {
                        grid-template-columns:1fr;
                    }

                    .rb-input-grid {
                        grid-template-columns:1fr;
                    }

                    .rb-passenger-row {
                        grid-template-columns:1fr;
                    }

                    .rb-rider-card {
                        align-items:flex-start;
                        flex-wrap:wrap;
                    }

                    .rb-request-btn {
                        width:100%;
                    }

                    .rb-payment-options {
                        grid-template-columns:1fr;
                    }

                    .rb-cash-box {
                        display:block;
                    }

                    .rb-pay-btn {
                        width:100%;
                        margin-top:12px;
                    }

                    .rb-footer {
                        display:block;
                    }

                    .rb-operational {
                        margin-top:12px;
                    }

                    .rb-toast-layer {
                        top:78px;
                        right:16px;
                        left:16px;
                        width:auto;
                    }
                }

                @media(max-width:480px) {

                    .rb-topbar-inner {
                        min-height:70px;
                    }

                    .rb-brand-logo {
                        width:42px;
                        height:42px;
                    }

                    .rb-brand h1 {
                        font-size:17px;
                    }

                    .rb-avatar {
                        width:37px;
                        height:37px;
                    }

                    .rb-hero h2 {
                        font-size:29px;
                    }

                    .rb-accepted {
                        padding:18px;
                    }

                    .rb-booking-card {
                        padding:18px;
                    }

                    .rb-rider-card {
                        padding:18px;
                    }
                }

            `}</style>

            {/* =====================================================
                TOAST
            ===================================================== */}

            {toast && (
                <div
                    className="rb-toast-layer"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <div
                        className={`rb-toast ${toast.type}`}
                        role="status"
                    >
                        <div className="rb-toast-icon">
                            {toast.type === "success"
                                ? "✓"
                                : toast.type === "error"
                                ? "!"
                                : toast.type === "warning"
                                ? "⚠"
                                : "i"}
                        </div>

                        <div className="rb-toast-content">
                            <p className="rb-toast-title">
                                {toast.title}
                            </p>

                            <p className="rb-toast-message">
                                {toast.message}
                            </p>
                        </div>

                        <button
                            className="rb-toast-close"
                            onClick={closeToast}
                            aria-label="Close notification"
                        >
                            ×
                        </button>

                        <div className="rb-toast-progress" />
                    </div>
                </div>
            )}

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="rb-topbar">
                <div className="rb-topbar-inner">

                    <div className="rb-brand">

                        <div className="rb-brand-logo">
                            🏍️
                        </div>

                        <div>
                            <h1>
                                RideBack
                            </h1>

                            <p>
                                Passenger Portal · Smart rides
                            </p>
                        </div>

                    </div>

                    <div className="rb-userbar">

                        <div className="rb-user-info">
                            <div className="rb-user-name">
                                {user.name ||
                                    "Passenger"}
                            </div>

                            <div className="rb-user-role">
                                RideBack Passenger
                            </div>
                        </div>

                        <div className="rb-avatar">
                            {firstLetter}
                        </div>

                        <button
                            className="rb-logout"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>

                </div>
            </header>

            {/* =====================================================
                MAIN LAYOUT
            ===================================================== */}

            <div className="rb-layout">

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="rb-sidebar">

                    <div className="rb-sidebar-card">

                        <div className="rb-side-label">
                            Navigation
                        </div>

                        <button
                            className="rb-side-btn active"
                            onClick={() =>
                                window.scrollTo({
                                    top:0,
                                    behavior:"smooth",
                                })
                            }
                        >
                            🏠 Dashboard
                        </button>

                        <button
                            className="rb-side-btn"
                            onClick={() =>
                                document
                                    .getElementById(
                                        "find-ride"
                                    )
                                    ?.scrollIntoView({
                                        behavior:"smooth",
                                    })
                            }
                        >
                            🔍 Find a Ride
                        </button>

                        <button
                            className="rb-side-btn"
                            onClick={() =>
                                document
                                    .getElementById(
                                        "riders"
                                    )
                                    ?.scrollIntoView({
                                        behavior:"smooth",
                                    })
                            }
                        >
                            🛵 Available Riders
                        </button>

                        <button
                            className="rb-side-btn"
                            onClick={() =>
                                document
                                    .getElementById(
                                        "active-ride"
                                    )
                                    ?.scrollIntoView({
                                        behavior:"smooth",
                                    })
                            }
                        >
                            🗺️ My Ride
                        </button>

                        <div className="rb-side-profile">

                            <div className="rb-side-avatar">
                                {firstLetter}
                            </div>

                            <div>
                                <strong>
                                    {user.name ||
                                        "Passenger"}
                                </strong>

                                <span>
                                    Travel smarter with RideBack
                                </span>
                            </div>

                        </div>

                    </div>

                </aside>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <main className="rb-main">

                    <div className="rb-container">

                        {/* =================================================
                            HERO
                        ================================================= */}

                        <section className="rb-hero">

                            <div className="rb-hero-grid">

                                <div>

                                    <div className="rb-eyebrow">
                                        🚕 RideBack Passenger
                                    </div>

                                    <h2>
                                        Find your ride
                                        <br />
                                        at the right moment.
                                    </h2>

                                    <p>
                                        Connect with riders who
                                        have already completed
                                        their delivery and are
                                        travelling your way.
                                        Enjoy a smarter journey
                                        with RideBack.
                                    </p>

                                </div>

                                <div className="rb-booking-summary">

                                    <small>
                                        Your journey
                                    </small>

                                    <div className="rb-booking-summary-value">
                                        {acceptedRide
                                            ? "Ride Active"
                                            : pendingRequest
                                            ? "Waiting for Rider"
                                            : "Ready to Ride"}
                                    </div>

                                    <div className="rb-booking-summary-text">
                                        {acceptedRide
                                            ? "Your rider has accepted your request."
                                            : pendingRequest
                                            ? `Waiting for ${selectedRider?.name || "your rider"} to respond.`
                                            : "Enter your pickup and destination to find available riders."}
                                    </div>

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            STATS
                        ================================================= */}

                        <section className="rb-stats">

                            <div className="rb-stat">

                                <div className="rb-stat-label">
                                    Passengers
                                </div>

                                <div className="rb-stat-value">
                                    {passengers}
                                </div>

                                <div className="rb-stat-icon">
                                    👥
                                </div>

                            </div>

                            <div className="rb-stat">

                                <div className="rb-stat-label">
                                    Riders Found
                                </div>

                                <div className="rb-stat-value">
                                    {availableRiders.length}
                                </div>

                                <div className="rb-stat-icon">
                                    🛵
                                </div>

                            </div>

                            <div className="rb-stat">

                                <div className="rb-stat-label">
                                    Ride Status
                                </div>

                                <div
                                    className="rb-stat-value"
                                    style={{
                                        fontSize:"22px",
                                        textTransform:
                                            "capitalize",
                                    }}
                                >
                                    {acceptedRide
                                        ? acceptedRide.status === "completed"
                                            ? "Completed"
                                            : acceptedRide.status
                                        : pendingRequest
                                        ? "Waiting"
                                        : "Ready"}
                                </div>

                                <div className="rb-stat-icon">
                                    {acceptedRide
                                        ? "🟢"
                                        : pendingRequest
                                        ? "⏳"
                                        : "📍"}
                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            TIP
                        ================================================= */}

                        <div className="rb-tip">

                            <span>
                                💡
                            </span>

                            <div>
                                <strong>
                                    RideBack tip:
                                </strong>{" "}
                                Riders become available
                                after completing their
                                delivery. Choose a rider
                                travelling in your direction
                                for a smarter return journey.
                            </div>

                        </div>

                        {/* =================================================
                            FIND RIDE
                        ================================================= */}

                        <section
                            id="find-ride"
                            className="rb-section"
                        >

                            <div className="rb-section-head">

                                <div>

                                    <div className="rb-section-kicker">
                                        PASSENGER BOOKING
                                    </div>

                                    <h2>
                                        Find a Ride
                                    </h2>

                                </div>

                            </div>

                            <div className="rb-card rb-booking-card">

                                <form
                                    onSubmit={
                                        handleFindRiders
                                    }
                                >

                                    <div className="rb-input-grid">

                                        <div className="rb-input-group">

                                            <label>
                                                Pickup Location
                                            </label>

                                            <div className="rb-input-wrap">

                                                <span>
                                                    🟢
                                                </span>

                                                <input
                                                    type="text"
                                                    value={pickup}
                                                    onChange={(e) =>
                                                        setPickup(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter pickup location"
                                                />

                                            </div>

                                        </div>

                                        <div className="rb-input-group">

                                            <label>
                                                Destination
                                            </label>

                                            <div className="rb-input-wrap">

                                                <span>
                                                    🔴
                                                </span>

                                                <input
                                                    type="text"
                                                    value={drop}
                                                    onChange={(e) =>
                                                        setDrop(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Where are you going?"
                                                />

                                            </div>

                                        </div>

                                    </div>

                                    <div className="rb-passenger-row">

                                        <div className="rb-input-group">

                                            <label>
                                                Number of Passengers
                                            </label>

                                            <div className="rb-input-wrap">

                                                <span>
                                                    👥
                                                </span>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={
                                                        passengers
                                                    }
                                                    onChange={(e) =>
                                                        setPassengers(
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>

                                        <button
                                            type="submit"
                                            className="rb-find-btn"
                                            disabled={
                                                loadingRiders
                                            }
                                        >
                                            {loadingRiders
                                                ? "⏳ Finding Riders..."
                                                : "🔍 Find Available Riders"}
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </section>

                        {/* =================================================
                            AVAILABLE RIDERS
                        ================================================= */}

                        {availableRiders.length > 0 && (

                            <section
                                id="riders"
                                className="rb-section"
                            >

                                <div className="rb-section-head">

                                    <div>

                                        <div className="rb-section-kicker">
                                            RIDERS NEAR YOU
                                        </div>

                                        <h2>
                                            Available Riders
                                        </h2>

                                    </div>

                                </div>

                                {availableRiders.map(
                                    (rider) => (

                                        <div
                                            className="rb-card rb-rider-card"
                                            key={rider.id}
                                        >

                                            <div className="rb-rider-avatar">
                                                {rider.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    "R"}
                                            </div>

                                            <div className="rb-rider-info">

                                                <h3>
                                                    {rider.name}
                                                </h3>

                                                <p>
                                                    📞{" "}
                                                    {rider.phone ||
                                                        "Phone unavailable"}
                                                </p>

                                                <p>
                                                    📍{" "}
                                                    {rider.current_location ||
                                                        "Location updating..."}
                                                </p>

                                                <span className="rb-online-badge">
                                                    ● ONLINE
                                                </span>

                                            </div>

                                            <button
                                                className={
                                                    selectedRider?.id ===
                                                    rider.id
                                                        ? "rb-request-btn sent"
                                                        : "rb-request-btn"
                                                }
                                                onClick={() =>
                                                    handleRequestRider(
                                                        rider
                                                    )
                                                }
                                                disabled={
                                                    requestingRider
                                                }
                                            >
                                                {selectedRider?.id ===
                                                rider.id
                                                    ? "✓ Request Sent"
                                                    : "Request Rider →"}
                                            </button>

                                        </div>

                                    )
                                )}

                            </section>

                        )}

                        {/* =================================================
                            NO RIDERS
                        ================================================= */}

                        {bookingId &&
                            !loadingRiders &&
                            availableRiders.length === 0 &&
                            !selectedRider &&
                            !acceptedRide && (

                                <section className="rb-section">

                                    <div className="rb-card rb-empty">

                                        <div className="rb-empty-icon">
                                            🚕
                                        </div>

                                        <h3>
                                            No riders available
                                        </h3>

                                        <p>
                                            Your ride request was
                                            created, but there are
                                            currently no riders
                                            online.
                                        </p>

                                        <button
                                            className="rb-retry"
                                            onClick={
                                                handleFindRiders
                                            }
                                        >
                                            🔄 Check Again
                                        </button>

                                    </div>

                                </section>

                            )}

                        {/* =================================================
                            WAITING
                        ================================================= */}

                        {pendingRequest && (

                            <section className="rb-section">

                                <div className="rb-card rb-waiting">

                                    <div className="rb-wait-icon">
                                        ⏳
                                    </div>

                                    <div>

                                        <h3>
                                            Waiting for{" "}
                                            {selectedRider?.name ||
                                                "your rider"}
                                        </h3>

                                        <p>
                                            Your ride request
                                            has been sent.
                                            Waiting for the
                                            rider to accept...
                                        </p>

                                    </div>

                                </div>

                            </section>

                        )}

                        {/* =================================================
                            ACCEPTED RIDE
                        ================================================= */}

                        {acceptedRide && (

                            <section
                                id="active-ride"
                                className="rb-section"
                            >

                                <div className="rb-section-head">

                                    <div>

                                        <div className="rb-section-kicker">
                                            ACTIVE JOURNEY
                                        </div>

                                        <h2>
                                            Your Ride
                                        </h2>

                                    </div>

                                    <span className="rb-live-badge">
                                        ● LIVE
                                    </span>

                                </div>

                                <div className="rb-card rb-accepted">

                                    {/* HEADER */}

                                    <div className="rb-accepted-header">

                                        <div>

                                            <span className="rb-accepted-badge">
                                                {acceptedRide.status === "completed"
                                                    ? "✓ RIDE COMPLETED"
                                                    : "✓ RIDE ACCEPTED"}
                                            </span>

                                            <h2>
                                                {acceptedRide.status === "completed"
                                                    ? "Your ride has been completed"
                                                    : "Your rider is on the way"}
                                            </h2>

                                            <div className="rb-accepted-subtitle">
                                                {acceptedRide.status === "completed"
                                                    ? "Your journey is complete. Please proceed with payment."
                                                    : "Sit back and enjoy your journey."}
                                            </div>

                                            <div className="rb-accepted-subtitle">
                                                Sit back and enjoy
                                                your journey.
                                            </div>

                                        </div>

                                        <div className="rb-big-icon">
                                            🏍️
                                        </div>

                                    </div>

                                    {/* DETAILS */}

                                    <div className="rb-ride-details">

                                        {/* RIDER */}

                                        <div className="rb-rider-profile">

                                            <div className="rb-large-avatar">

                                                {acceptedRide.rider_name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    "R"}

                                            </div>

                                            <div>

                                                <small>
                                                    YOUR RIDER
                                                </small>

                                                <h3>
                                                    {
                                                        acceptedRide.rider_name
                                                    }
                                                </h3>

                                                <p>
                                                    📞{" "}
                                                    {
                                                        acceptedRide.rider_phone
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                        {/* ROUTE */}

                                        <div className="rb-route-box">

                                            <div className="rb-route-point">

                                                <span className="rb-route-dot rb-green" />

                                                <div>

                                                    <small>
                                                        PICKUP
                                                    </small>

                                                    <strong>
                                                        {
                                                            acceptedRide.pickup_location
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                            <div className="rb-route-divider" />

                                            <div className="rb-route-point">

                                                <span className="rb-route-dot rb-red" />

                                                <div>

                                                    <small>
                                                        DESTINATION
                                                    </small>

                                                    <strong>
                                                        {
                                                            acceptedRide.drop_location
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                    {/* MAP */}

                                    <div className="rb-map-section">

                                        <div className="rb-map-heading">

                                            <div>

                                                <h3>
                                                    🗺️ Live Ride Tracking
                                                </h3>

                                                <p>
                                                    Track your rider,
                                                    pickup location
                                                    and destination.
                                                </p>

                                            </div>

                                            <span className="rb-live-badge">
                                                ● LIVE
                                            </span>

                                        </div>

                                        <div className="rb-map-wrap">

                                            <PassengerMap
                                                riderLocation={
                                                    acceptedRide.rider_location ||
                                                    acceptedRide.current_location
                                                }
                                                pickupLocation={
                                                    acceptedRide.pickup_location
                                                }
                                                dropLocation={
                                                    acceptedRide.drop_location
                                                }
                                            />

                                        </div>

                                    </div>

                                    {/* STATUS */}

                                    <div className="rb-status-bar">

                                        <span>
                                            🟢 Ride Status
                                        </span>

                                        <strong>
                                            {
                                                acceptedRide.status
                                            }
                                        </strong>

                                    </div>

                                    {/* FARE */}

                                    <div className="rb-fare">

                                        <div className="rb-fare-head">

                                            <div>

                                                <h3>
                                                    💰 Your Fare
                                                </h3>

                                                <p>
                                                    Your fare is
                                                    calculated
                                                    from the ride
                                                    distance.
                                                </p>

                                            </div>

                                            {calculatingFare && (
                                                <span className="rb-calculating">
                                                    Calculating...
                                                </span>
                                            )}

                                        </div>

                                        <div className="rb-distance">

                                            <label>
                                                Ride Distance
                                            </label>

                                            <div className="rb-distance-value">
                                                {distance
                                                    ? `${distance} KM`
                                                    : calculatingFare
                                                    ? "Calculating..."
                                                    : "Distance unavailable"}
                                            </div>

                                        </div>

                                        {fare && (

                                            <div className="rb-fare-result">

                                                <div className="rb-fare-row">

                                                    <span>
                                                        Distance
                                                    </span>

                                                    <strong>
                                                        {
                                                            fare.distance_km
                                                        }{" "}
                                                        km
                                                    </strong>

                                                </div>

                                                <div className="rb-fare-row">

                                                    <span>
                                                        Base Fare
                                                    </span>

                                                    <span>
                                                        ₹
                                                        {
                                                            fare.base_fare
                                                        }
                                                    </span>

                                                </div>

                                                <div className="rb-fare-row rb-discount">

                                                    <span>
                                                        RideBack Discount
                                                    </span>

                                                    <span>
                                                        − ₹
                                                        {
                                                            fare.discount
                                                        }
                                                    </span>

                                                </div>

                                                <div className="rb-fare-total">

                                                    <span>
                                                        Total Fare
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {
                                                            fare.final_fare
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                    {/* PAYMENT */}

                                    {fare && (

                                        <div className="rb-payment">

                                            <h3>
                                                💳 Choose Payment Method
                                            </h3>

                                            <p>
                                                Select how you want
                                                to pay for your ride.
                                            </p>

                                            <div className="rb-payment-options">

                                                {/* CASH */}

                                                <button
                                                    className={
                                                        paymentMethod ===
                                                        "cash"
                                                            ? "rb-payment-btn selected"
                                                            : "rb-payment-btn"
                                                    }
                                                    onClick={() =>
                                                        handlePaymentMethod(
                                                            "cash"
                                                        )
                                                    }
                                                    disabled={
                                                        paymentLoading
                                                    }
                                                >

                                                    <div className="rb-payment-icon">
                                                        💵
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            Cash
                                                        </strong>

                                                        <small>
                                                            Pay rider directly
                                                        </small>

                                                    </div>

                                                    {paymentMethod ===
                                                        "cash" && (
                                                        <span className="rb-payment-check">
                                                            ✓
                                                        </span>
                                                    )}

                                                </button>

                                                {/* ONLINE */}

                                                <button
                                                    className={
                                                        paymentMethod ===
                                                        "online"
                                                            ? "rb-payment-btn selected"
                                                            : "rb-payment-btn"
                                                    }
                                                    onClick={() =>
                                                        handlePaymentMethod(
                                                            "online"
                                                        )
                                                    }
                                                    disabled={
                                                        paymentLoading
                                                    }
                                                >

                                                    <div className="rb-payment-icon">
                                                        💳
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            Online
                                                        </strong>

                                                        <small>
                                                            Pay digitally
                                                        </small>

                                                    </div>

                                                    {paymentMethod ===
                                                        "online" && (
                                                        <span className="rb-payment-check">
                                                            ✓
                                                        </span>
                                                    )}

                                                </button>

                                            </div>

                                            {/* CASH */}

                                            {paymentMethod ===
                                                "cash" &&
                                                paymentStatus !==
                                                    "paid" && (

                                                <div className="rb-cash-box">

                                                    <div>

                                                        <h4>
                                                            💵 Cash Payment
                                                        </h4>

                                                        <p>
                                                            Pay{" "}
                                                            <strong>
                                                                ₹
                                                                {
                                                                    fare.final_fare
                                                                }
                                                            </strong>{" "}
                                                            directly
                                                            to the rider.
                                                        </p>

                                                    </div>

                                                    <button
                                                        className="rb-pay-btn"
                                                        onClick={
                                                            handleCashPayment
                                                        }
                                                        disabled={
                                                            paymentLoading
                                                        }
                                                    >
                                                        {paymentLoading
                                                            ? "Processing..."
                                                            : "Complete Payment"}
                                                    </button>

                                                </div>

                                            )}

                                            {/* ONLINE */}

                                            {paymentMethod ===
                                                "online" && (

                                                <div className="rb-online-box">

                                                    <h4>
                                                        💳 Online Payment
                                                    </h4>

                                                    <div className="rb-online-amount">
                                                        ₹
                                                        {
                                                            fare.final_fare
                                                        }
                                                    </div>

                                                    <button
                                                            className={
                                                                paymentMethod === "online"
                                                                    ? "payment-btn online selected"
                                                                    : "payment-btn online"
                                                            }
                                                            onClick={() =>
                                                                handlePaymentMethod("online")
                                                            }
                                                            disabled={paymentLoading}
                                                        >
                                                            <span>
                                                                💳
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    UPI / Online
                                                                </strong>

                                                                <small>
                                                                    Pay securely with UPI
                                                                </small>
                                                            </div>

                                                            {/* ONLINE */}
{/* ONLINE */}
{paymentMethod === "online" && (
    <div className="rb-online-box">

        <h4>
            💳 Online Payment
        </h4>

        <div className="rb-online-amount">
            ₹{fare.final_fare}
        </div>

        <div className="online-payment">

            <div className="online-payment-icon">
                💳
            </div>

            <h4>
                UPI / Online Payment
            </h4>

            <p>
                Pay securely using UPI through Razorpay.
            </p>

            <div className="online-amount">
                ₹{fare.final_fare}
            </div>

            <button
                type="button"
                className="online-pay-btn"
                onClick={handleOnlinePayment}
                disabled={paymentLoading}
            >
                {paymentLoading
                    ? "Opening Payment..."
                    : `Pay ₹${fare.final_fare} with UPI`}

                {!paymentLoading && (
                    <span>→</span>
                )}
            </button>

            <small>
                🔒 Secure payment powered by Razorpay
            </small>

        </div>

    </div>
)}
                                                        </button>

                                                </div>

                                            )}

                                            {/* SUCCESS */}

                                            {paymentStatus ===
                                                "paid" && (

                                                <div className="rb-payment-success">

                                                    <div className="rb-success-icon">
                                                        ✓
                                                    </div>

                                                    <div>

                                                        <h3>
                                                            Payment Completed
                                                        </h3>

                                                        <p>
                                                            ₹
                                                            {
                                                                fare.final_fare
                                                            }{" "}
                                                            paid using{" "}
                                                            {
                                                                paymentMethod
                                                            }.
                                                        </p>

                                                    </div>

                                                </div>

                                            )}

                                        </div>

                                    )}

                                </div>

                            </section>

                        )}

                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <footer className="rb-footer">

                            <div>

                                <p>
                                    <strong>
                                        RideBack Passenger
                                    </strong>
                                </p>

                                <small>
                                    Smarter rides. Better returns.
                                </small>

                            </div>

                            <div className="rb-operational">

                                <i />

                                System operational

                            </div>

                        </footer>

                    </div>

                </main>

            </div>

        </div>
    );
};

export default PassengerDashboard;