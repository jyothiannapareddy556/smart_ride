import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import RiderMap from "../components/RiderMap";

export default function RiderDashboard() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [currentLocation, setCurrentLocation] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Professional in-app notifications
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = "success", title) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

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

    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  };

  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  const [rideHistory, setRideHistory] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [completedRidesCount, setCompletedRidesCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // =====================================================
  // GPS REFERENCES
  // =====================================================

  const locationWatchRef = useRef(null);
  const lastLocationUpdateRef = useRef(0);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    console.log("STORED USER:", storedUser);

    if (!storedUser) {
      showToast("User information not found. Please login again.", "error");
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      console.log("PARSED USER:", parsedUser);
      console.log("RIDER ID:", parsedUser.id);

      setUser(parsedUser);
    } catch (error) {
      console.error("USER PARSE ERROR:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/login");
    }
  }, [navigate]);

  // =====================================================
  // STOP GPS WHEN PAGE CLOSES
  // =====================================================

  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null) {
        console.log("CLEARING GPS WATCHER");

        navigator.geolocation.clearWatch(
          locationWatchRef.current
        );

        locationWatchRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // =====================================================
  // LOAD RIDES
  // =====================================================

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  const fetchRides = async () => {
    try {
      if (!user?.id) {
        console.log("RIDER ID NOT FOUND");
        return;
      }

      console.log(
        "FETCHING RIDES FOR RIDER:",
        user.id
      );

      const res = await api.get(
        `/rider/pending?rider_id=${user.id}`
      );

      /*console.log(
        "RIDER REQUESTS RESPONSE:",
        res.data
      );
    

      setRides(res.data || []);*/
      console.log(
  "RIDER REQUESTS RESPONSE:",
  res.data
);

console.log("FIRST RIDE DATA:", res.data?.[0]);
console.log("PICKUP:", res.data?.[0]?.pickup_location);
console.log("DROP:", res.data?.[0]?.drop_location);
console.log("PICKUP LAT:", res.data?.[0]?.pickup_lat);
console.log("PICKUP LNG:", res.data?.[0]?.pickup_lng);
console.log("DROP LAT:", res.data?.[0]?.drop_lat);
console.log("DROP LNG:", res.data?.[0]?.drop_lng);

setRides(res.data || []);
    } catch (error) {
      console.error(
        "FETCH RIDES ERROR:",
        error
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );
    }
  };

  // =====================================================
  // FETCH RIDE HISTORY
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      fetchRideHistory();
    }
  }, [user]);

  const fetchRideHistory = async () => {
    try {
      if (!user?.id) return;

      setHistoryLoading(true);

      const res = await api.get(
        `/rider/history/${user.id}`
      );

      console.log(
        "RIDER HISTORY:",
        res.data
      );

      setRideHistory(
        res.data.rides || []
      );

      setTotalEarnings(
        Number(res.data.totalEarnings || 0)
      );

      setCompletedRidesCount(
        Number(res.data.completedRides || 0)
      );
    } catch (error) {
      console.error(
        "FETCH RIDER HISTORY ERROR:",
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =====================================================
  // UPDATE GPS LOCATION
  // =====================================================

  const startGPSTracking = () => {
    if (!user?.id) {
      console.error("Rider ID missing");
      return;
    }

    if (!navigator.geolocation) {
      showToast(
        "GPS is not supported by this browser.",
        "error"
      );
      return;
    }

    console.log(
      "STARTING REAL GPS TRACKING"
    );

    // Prevent multiple GPS watchers

    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(
        locationWatchRef.current
      );

      locationWatchRef.current = null;
    }

    locationWatchRef.current =
      navigator.geolocation.watchPosition(
        async (position) => {
          try {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            const accuracy =
              position.coords.accuracy;

            const location =
              `${latitude},${longitude}`;

            console.log(
              "REAL GPS LOCATION:",
              location
            );

            console.log(
              "GPS ACCURACY:",
              accuracy,
              "meters"
            );

            setCurrentLocation(location);

            /*
             * Send location to backend
             * at most once every 5 seconds.
             */

            const now = Date.now();

            if (
              now -
              lastLocationUpdateRef.current <
              5000
            ) {
              return;
            }

            lastLocationUpdateRef.current =
              now;

            await api.put(
              "/rider/location",
              {
                rider_id: Number(user.id),
                current_location: location,
              }
            );

            console.log(
              "LOCATION SENT TO SERVER:",
              location
            );
          } catch (error) {
            console.error(
              "GPS SERVER UPDATE ERROR:",
              error
            );
          }
        },

        (error) => {
          console.error(
            "REAL GPS ERROR:",
            error
          );

          if (error.code === 1) {
            showToast(
              "Location permission denied. Please allow GPS permission.",
              "error"
            );
          }

          if (error.code === 2) {
            showToast(
              "Unable to determine your location.",
              "error"
            );
          }

          if (error.code === 3) {
            showToast(
              "GPS request timed out.",
              "error"
            );
          }
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
  };

  // =====================================================
  // GO ONLINE
  // =====================================================

  const goOnline = () => {
    if (!user?.id) {
      showToast(
        "Rider information not found. Please login again."
      );
      return;
    }

    if (!navigator.geolocation) {
      showToast(
        "GPS is not supported by this browser.",
        "error"
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracy =
            position.coords.accuracy;

          const location =
            `${latitude},${longitude}`;

          console.log(
            "INITIAL REAL GPS:",
            location
          );

          console.log(
            "GPS ACCURACY:",
            accuracy,
            "meters"
          );

          // Save first location immediately

          await api.put(
            "/rider/location",
            {
              rider_id: Number(user.id),
              current_location: location,
            }
          );

          setCurrentLocation(location);

          setIsOnline(true);

          // Start continuous GPS tracking

          startGPSTracking();

          showToast(
            "You are online. Real GPS tracking started."
          );
        } catch (error) {
          console.error(
            "GO ONLINE ERROR:",
            error
          );

          setIsOnline(false);

          showToast(
            error.response?.data?.message ||
            "Failed to go online.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error(
          "INITIAL GPS ERROR:",
          error
        );

        setLoading(false);
        setIsOnline(false);

        if (error.code === 1) {
          showToast(
            "Location permission denied. Please allow location access."
          );
        } else if (error.code === 2) {
          showToast(
            "Unable to determine your current location."
          );
        } else if (error.code === 3) {
          showToast(
            "GPS request timed out. Please try again."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // =====================================================
  // GO OFFLINE
  // =====================================================

  const goOffline = async () => {
    if (!user?.id) {
      showToast(
        "Rider information not found. Please login again."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "GOING OFFLINE:",
        user.id
      );

      // STOP GPS WATCHER

      if (locationWatchRef.current !== null) {
        console.log(
          "STOPPING REAL GPS TRACKING"
        );

        navigator.geolocation.clearWatch(
          locationWatchRef.current
        );

        locationWatchRef.current = null;
      }

      // Update database

      const res = await api.put(
        "/rider/offline",
        {
          rider_id: Number(user.id),
        }
      );

      console.log(
        "OFFLINE RESPONSE:",
        res.data
      );

      setIsOnline(false);
      setCurrentLocation("");

      showToast(
        res.data.message ||
        "You are now offline."
      );
    } catch (error) {
      console.error(
        "GO OFFLINE ERROR:",
        error
      );

      showToast(
        error.response?.data?.message ||
        "Failed to go offline.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // TOGGLE ONLINE / OFFLINE
  // =====================================================

  const toggleOnlineStatus = () => {
    if (isOnline) {
      goOffline();
    } else {
      goOnline();
    }
  };

  // =====================================================
  // ACCEPT RIDE
  // =====================================================

  const handleAcceptRide = async (id) => {
    try {
      console.log(
        "Booking ID:",
        id
      );

      console.log(
        "Current user:",
        user
      );

      if (!user) {
        showToast(
          "User not loaded. Please login again."
        );
        return;
      }

      if (!user.id) {
        console.error(
          "User object does not contain id:",
          user
        );

        showToast(
          "Rider ID is missing. Please logout and login again."
        );

        return;
      }

      const riderId =
        Number(user.id);

      console.log(
        "Sending rider ID:",
        riderId
      );

      const res = await api.put(
        `/rider/accept/${id}`,
        {
          rider_id: riderId,
        }
      );

      console.log(
        "Accept response:",
        res.data
      );

      showToast(
        res.data.message
      );

      await fetchRides();
    } catch (error) {
      console.error(
        "ACCEPT RIDE ERROR:",
        error
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

      showToast(
        error.response?.data?.message ||
        error.message ||
        "Failed to accept ride"
      );
    }
  };

  // =====================================================
  // REJECT RIDE
  // =====================================================

  const handleRejectRide = async (id) => {
    try {
      if (!user?.id) {
        showToast(
          "Rider information not found."
        );
        return;
      }

      const res = await api.put(
        `/rider/reject/${id}`,
        {
          rider_id: Number(user.id),
        }
      );

      showToast(
        res.data.message
      );

      await fetchRides();
    } catch (error) {
      console.error(
        "REJECT RIDE ERROR:",
        error
      );

      showToast(
        error.response?.data?.message ||
        "Failed to reject ride.",
        "error"
      );
    }
  };

  // =====================================================
  // START RIDE
  // =====================================================

  const startRide = async (bookingId) => {
    try {
      if (!user?.id) {
        showToast(
          "Rider information not found."
        );
        return;
      }

      const res = await api.put(
        `/rider/start/${bookingId}`,
        {
          rider_id: Number(user.id),
        }
      );

      showToast(
        res.data.message ||
        "Ride started successfully"
      );

      await fetchRides();
    } catch (error) {
      console.error(
        "START RIDE ERROR:",
        error
      );

      showToast(
        error.response?.data?.message ||
        "Failed to start ride",
        "error"
      );
    }
  };

  // =====================================================
  // COMPLETE RIDE
  // =====================================================

  const completeRide = async (bookingId) => {
    try {
      if (!user?.id) {
        showToast(
          "Rider information not found."
        );
        return;
      }

      const res = await api.put(
        `/rider/complete/${bookingId}`,
        {
          rider_id: Number(user.id),
        }
      );

      showToast(
        res.data.message ||
        "Ride completed successfully"
      );

      await fetchRides();

      // Refresh earnings/history after completion

      await fetchRideHistory();
    } catch (error) {
      console.error(
        "COMPLETE RIDE ERROR:",
        error
      );

      showToast(
        error.response?.data?.message ||
        "Failed to complete ride",
        "error"
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    // Stop GPS tracking

    if (
      locationWatchRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        locationWatchRef.current
      );

      locationWatchRef.current = null;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };


  // =====================================================
  // COUNTS
  // =====================================================

  const pendingRides = rides.filter((ride) => ride.status === "pending").length;
  const acceptedRides = rides.filter((ride) => ride.status === "accepted" || ride.status === "ongoing").length;
  const completedRides = completedRidesCount;

  // =====================================================
  // LOADING
  // =====================================================

  if (!user) {
    return (
      <div className="rb-loading-page">
        <div className="rb-loader-card">
          <div className="rb-spinner" />
          <h3>Preparing your rider dashboard</h3>
          <p>Connecting your RideBack account...</p>
        </div>
      </div>
    );
  }

  const firstLetter = user.name?.charAt(0)?.toUpperCase() || "R";

  return (
    <div className="rb-page">
      <style>{`
        * { box-sizing: border-box; }
        .rb-page { min-height:100vh; color:#102033; background:radial-gradient(circle at 15% 10%,rgba(16,185,129,.12),transparent 28%),radial-gradient(circle at 90% 20%,rgba(14,165,233,.10),transparent 25%),linear-gradient(135deg,#f5faf8 0%,#eef5f7 45%,#f8fafc 100%); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        .rb-topbar { position:sticky; top:0; z-index:30; backdrop-filter:blur(18px); background:rgba(255,255,255,.86); border-bottom:1px solid rgba(148,163,184,.18); box-shadow:0 8px 30px rgba(15,23,42,.06); }
        .rb-topbar-inner { max-width:1450px; margin:auto; min-height:82px; padding:14px 28px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .rb-brand { display:flex; align-items:center; gap:12px; }
        .rb-brand-logo { width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,#059669,#0f766e);color:white;font-size:25px;box-shadow:0 12px 25px rgba(5,150,105,.28); }
        .rb-brand h1 { margin:0;font-size:20px;font-weight:900;letter-spacing:-.5px; }
        .rb-brand p { margin:2px 0 0;color:#64748b;font-size:12px;font-weight:700; }
        .rb-userbar { display:flex;align-items:center;gap:12px; }
        .rb-avatar { width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:white;font-weight:900;background:linear-gradient(135deg,#0f766e,#059669);box-shadow:0 7px 18px rgba(5,150,105,.22); }
        .rb-user-name { font-weight:850;font-size:14px; }
        .rb-user-role { color:#64748b;font-size:11px;margin-top:1px; }
        .rb-status-pill { display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:#f0fdf4;color:#15803d;font-size:12px;font-weight:850; }
        .rb-status-dot { width:9px;height:9px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,.10); }
        .rb-status-dot.online { background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12);animation:rbPulse 1.7s infinite; }
        @keyframes rbPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        .rb-logout { border:0;background:#fff1f2;color:#dc2626;padding:10px 15px;border-radius:12px;font-weight:800;cursor:pointer;transition:.2s; }
        .rb-logout:hover { background:#dc2626;color:white;transform:translateY(-1px); }
        .rb-layout { display:grid;grid-template-columns:245px minmax(0,1fr);max-width:1500px;margin:auto; }
        .rb-sidebar { min-height:calc(100vh - 82px);padding:26px 18px;position:sticky;top:82px;align-self:start; }
        .rb-sidebar-card { background:rgba(15,23,42,.96);border-radius:26px;padding:18px;box-shadow:0 22px 45px rgba(15,23,42,.18);color:white; }
        .rb-side-label { color:#64748b;text-transform:uppercase;letter-spacing:1.3px;font-size:10px;font-weight:900;padding:8px 10px; }
        .rb-side-btn { width:100%;display:flex;align-items:center;gap:11px;border:0;background:transparent;color:#94a3b8;padding:12px;border-radius:13px;font-weight:800;cursor:pointer;text-align:left;margin-top:5px;transition:.2s; }
        .rb-side-btn:hover,.rb-side-btn.active { background:#064e3b;color:white;box-shadow:inset 0 0 0 1px rgba(52,211,153,.15); }
        .rb-side-profile { margin-top:25px;padding-top:18px;border-top:1px solid #1e293b;display:flex;gap:10px;align-items:center; }
        .rb-side-avatar { width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#059669;font-weight:900; }
        .rb-side-profile strong { display:block;font-size:13px; }
        .rb-side-profile span { color:#64748b;font-size:11px; }
        .rb-main { min-width:0;padding:28px 30px 50px; }
        .rb-container { max-width:1180px;margin:auto; }
        .rb-hero { position:relative;overflow:hidden;border-radius:30px;padding:34px;background:linear-gradient(135deg,#064e3b 0%,#047857 46%,#0f766e 100%);color:white;box-shadow:0 25px 55px rgba(4,120,87,.22);margin-bottom:25px; }
        .rb-hero:before { content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-90px;top:-150px;background:rgba(255,255,255,.08); }
        .rb-hero:after { content:"🏍️";position:absolute;right:48px;bottom:-24px;font-size:145px;opacity:.15;transform:rotate(-8deg); }
        .rb-hero-grid { position:relative;z-index:1;display:flex;justify-content:space-between;gap:30px;align-items:center; }
        .rb-eyebrow { color:#a7f3d0;text-transform:uppercase;letter-spacing:1.5px;font-size:11px;font-weight:900; }
        .rb-hero h2 { margin:8px 0 0;font-size:clamp(30px,4vw,48px);line-height:1.03;letter-spacing:-1.7px;font-weight:950; }
        .rb-hero p { max-width:650px;color:#d1fae5;margin:14px 0 0;line-height:1.65;font-size:14px; }
        .rb-online-card { width:260px;flex:0 0 260px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.15);backdrop-filter:blur(16px);border-radius:22px;padding:20px;box-shadow:inset 0 1px rgba(255,255,255,.12); }
        .rb-online-card small { color:#a7f3d0;font-weight:700; }
        .rb-online-state { display:flex;align-items:center;gap:10px;margin:9px 0 16px;font-size:22px;font-weight:950; }
        .rb-online-state .dot { width:13px;height:13px;border-radius:50%;background:#f87171; }
        .rb-online-state .dot.online { background:#4ade80;box-shadow:0 0 0 6px rgba(74,222,128,.12);animation:rbPulse 1.7s infinite; }
        .rb-btn { border:0;border-radius:14px;padding:13px 17px;font-weight:900;cursor:pointer;transition:.2s;display:inline-flex;align-items:center;justify-content:center;gap:8px; }
        .rb-btn:hover:not(:disabled) { transform:translateY(-2px); }
        .rb-btn:disabled { opacity:.55;cursor:not-allowed; }
        .rb-btn-online { width:100%;background:white;color:#047857;box-shadow:0 12px 24px rgba(0,0,0,.12); }
        .rb-btn-offline { width:100%;background:#ef4444;color:white;box-shadow:0 12px 24px rgba(239,68,68,.22); }
        .rb-stats { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:25px; }
        .rb-stat { background:rgba(255,255,255,.88);border:1px solid rgba(226,232,240,.75);border-radius:22px;padding:21px;box-shadow:0 14px 35px rgba(15,23,42,.07);position:relative;overflow:hidden; }
        .rb-stat:after { content:"";position:absolute;width:100px;height:100px;border-radius:50%;right:-40px;top:-45px;background:rgba(16,185,129,.07); }
        .rb-stat-label { color:#64748b;font-size:12px;font-weight:800; }
        .rb-stat-value { font-size:34px;font-weight:950;letter-spacing:-1px;margin-top:6px; }
        .rb-stat-icon { position:absolute;right:18px;bottom:17px;font-size:28px; }
        .rb-section { margin-top:30px; }
        .rb-section-head { display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin-bottom:14px; }
        .rb-section-kicker { color:#059669;font-size:11px;letter-spacing:1.2px;font-weight:950; }
        .rb-section h2 { margin:3px 0 0;font-size:25px;letter-spacing:-.7px;font-weight:950; }
        .rb-refresh { background:white;color:#334155;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer;transition:.2s; }
        .rb-refresh:hover { border-color:#10b981;color:#047857;box-shadow:0 8px 20px rgba(15,23,42,.06); }
        .rb-card { background:rgba(255,255,255,.92);border:1px solid rgba(226,232,240,.75);border-radius:25px;box-shadow:0 15px 40px rgba(15,23,42,.07); }
        .rb-earn-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
        .rb-earn-card { padding:22px;display:flex;justify-content:space-between;align-items:center; }
        .rb-earn-label { color:#64748b;font-size:12px;font-weight:800; }
        .rb-earn-value { font-size:28px;font-weight:950;margin-top:5px; }
        .rb-icon-box { width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:23px;background:#ecfdf5; }
        .rb-tip { margin-top:18px;background:linear-gradient(135deg,#ecfdf5,#f0fdfa);border:1px solid #bbf7d0;border-radius:17px;padding:15px;display:flex;gap:12px;align-items:flex-start;color:#065f46; }
        .rb-history-card { padding:22px;margin-bottom:14px; }
        .rb-history-top,.rb-ride-top { display:flex;justify-content:space-between;gap:15px;align-items:flex-start; }
        .rb-muted { color:#94a3b8;font-size:12px; }
        .rb-title { font-size:18px;font-weight:950;margin:4px 0; }
        .rb-status { padding:8px 12px;border-radius:999px;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap; }
        .rb-status.pending { background:#fffbeb;color:#a16207; }.rb-status.accepted{background:#ecfdf5;color:#047857;}.rb-status.ongoing{background:#eff6ff;color:#1d4ed8;}.rb-status.completed{background:#ecfdf5;color:#15803d;}.rb-status.rejected{background:#fff1f2;color:#dc2626; }
        .rb-route-box { margin-top:16px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #eef2f7; }
        .rb-route-grid { display:grid;grid-template-columns:1fr 1fr;gap:15px; }
        .rb-route-label { font-size:10px;font-weight:900;color:#94a3b8;letter-spacing:.8px; }
        .rb-route-value { margin-top:5px;font-weight:850;line-height:1.45; }
        .rb-meta-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px; }
        .rb-meta { background:#f8fafc;border:1px solid #eef2f7;border-radius:14px;padding:13px; }
        .rb-meta strong { display:block;margin-top:4px;font-size:13px; }
        .rb-empty { padding:45px 22px;text-align:center;border:1px dashed #cbd5e1; }
        .rb-empty-icon { font-size:54px; }
        .rb-empty h3 { margin:12px 0 0;font-size:20px;font-weight:950; }
        .rb-empty p { color:#94a3b8;max-width:520px;margin:7px auto 0;line-height:1.55; }
        .rb-online-section { padding:25px; }
        .rb-location-panel { display:flex;align-items:center;justify-content:space-between;gap:20px; }
        .rb-location-title { display:flex;gap:13px;align-items:center; }
        .rb-location-title h3 { margin:0;font-size:16px;font-weight:950; }
        .rb-location-title p { margin:4px 0 0;color:#64748b;font-size:13px; }
        .rb-location-value { margin-top:15px;background:#f8fafc;border:1px solid #eef2f7;padding:12px 14px;border-radius:14px;font-weight:750;font-size:13px;word-break:break-word; }
        .rb-big-online { min-width:180px; }
        .rb-ride-card { padding:25px; margin-bottom:18px;transition:.25s; }
        .rb-ride-card:hover { transform:translateY(-3px);box-shadow:0 24px 55px rgba(15,23,42,.11); }
        .rb-passenger { display:flex;align-items:center;gap:13px; }
        .rb-passenger-avatar { width:52px;height:52px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#dbeafe,#e0f2fe);font-size:24px; }
        .rb-passenger h3 { margin:0;font-size:20px;font-weight:950; }
        .rb-map-wrap { margin-top:17px;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(15,23,42,.06); }
        .rb-action-row { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px;padding-top:18px;border-top:1px solid #eef2f7; }
        .rb-accept { background:linear-gradient(135deg,#059669,#047857);color:white;box-shadow:0 12px 25px rgba(5,150,105,.20); }
        .rb-reject { background:#fff1f2;color:#dc2626; }
        .rb-start { width:100%;background:linear-gradient(135deg,#059669,#0f766e);color:white;box-shadow:0 12px 25px rgba(5,150,105,.20);margin-top:13px; }
        .rb-complete { width:100%;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;box-shadow:0 12px 25px rgba(37,99,235,.18);margin-top:13px; }
        .rb-message { padding:15px;border-radius:15px;margin-top:18px;font-size:13px;line-height:1.5; }
        .rb-message.success { background:#ecfdf5;color:#047857;border:1px solid #bbf7d0; }.rb-message.info{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;}.rb-message.error{background:#fff1f2;color:#dc2626;border:1px solid #fecdd3;}
        .rb-toast-layer { position:fixed; top:96px; right:24px; z-index:1000; width:min(390px,calc(100vw - 32px)); pointer-events:none; }
        .rb-toast { pointer-events:auto; position:relative; overflow:hidden; display:flex; align-items:flex-start; gap:13px; padding:16px 16px 17px; border:1px solid rgba(255,255,255,.75); border-radius:18px; background:rgba(255,255,255,.96); backdrop-filter:blur(18px); box-shadow:0 22px 55px rgba(15,23,42,.20),0 3px 10px rgba(15,23,42,.08); animation:rbToastIn .42s cubic-bezier(.2,.8,.2,1); }
        .rb-toast.success { border-left:4px solid #10b981; } .rb-toast.error { border-left:4px solid #ef4444; } .rb-toast.warning { border-left:4px solid #f59e0b; } .rb-toast.info { border-left:4px solid #0ea5e9; }
        .rb-toast-icon { width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:grid;place-items:center;font-size:18px;font-weight:950; }
        .rb-toast.success .rb-toast-icon { background:#ecfdf5;color:#059669; } .rb-toast.error .rb-toast-icon { background:#fef2f2;color:#dc2626; } .rb-toast.warning .rb-toast-icon { background:#fffbeb;color:#d97706; } .rb-toast.info .rb-toast-icon { background:#eff6ff;color:#0284c7; }
        .rb-toast-content { flex:1;min-width:0;padding-top:1px; } .rb-toast-title { margin:0;color:#0f172a;font-size:14px;font-weight:950; } .rb-toast-message { margin:4px 0 0;color:#64748b;font-size:12px;line-height:1.5;font-weight:650; }
        .rb-toast-close { border:0;background:transparent;color:#94a3b8;font-size:20px;line-height:1;cursor:pointer;padding:0 2px; } .rb-toast-close:hover { color:#0f172a; }
        .rb-toast-progress { position:absolute;left:0;bottom:0;height:3px;width:100%;transform-origin:left;animation:rbToastProgress 4.2s linear forwards; }
        .rb-toast.success .rb-toast-progress { background:#10b981; } .rb-toast.error .rb-toast-progress { background:#ef4444; } .rb-toast.warning .rb-toast-progress { background:#f59e0b; } .rb-toast.info .rb-toast-progress { background:#0ea5e9; }
        @keyframes rbToastIn { from { opacity:0;transform:translate3d(35px,-12px,0) scale(.96); } to { opacity:1;transform:translate3d(0,0,0) scale(1); } }
        @keyframes rbToastProgress { from { transform:scaleX(1); } to { transform:scaleX(0); } }
        @media (max-width:700px) { .rb-toast-layer { top:78px;right:16px;left:16px;width:auto; } }
        .rb-footer { margin-top:35px;padding:20px 22px;border-radius:22px;background:#0f172a;color:white;display:flex;align-items:center;justify-content:space-between;gap:15px;box-shadow:0 20px 45px rgba(15,23,42,.16); }
        .rb-footer p { margin:0; }.rb-footer small{color:#64748b;display:block;margin-top:4px;}.rb-operational{color:#34d399;font-size:12px;font-weight:800;display:flex;gap:7px;align-items:center;}.rb-operational i{width:8px;height:8px;background:#34d399;border-radius:50%;box-shadow:0 0 0 5px rgba(52,211,153,.08);}
        .rb-loading-page { min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#ecfdf5,#f8fafc);padding:20px; }.rb-loader-card{text-align:center;background:white;border-radius:24px;padding:35px;box-shadow:0 20px 50px rgba(15,23,42,.10);}.rb-spinner{width:48px;height:48px;border:4px solid #d1fae5;border-top-color:#059669;border-radius:50%;animation:rbSpin .8s linear infinite;margin:0 auto 18px;}@keyframes rbSpin{to{transform:rotate(360deg)}}.rb-loader-card h3{margin:0;font-weight:900}.rb-loader-card p{color:#64748b;font-size:13px;margin:6px 0 0}
        @media(max-width:1050px){.rb-layout{grid-template-columns:1fr}.rb-sidebar{display:none}.rb-main{padding:22px}.rb-hero-grid{align-items:flex-start}.rb-online-card{width:235px;flex-basis:235px}.rb-meta-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:760px){.rb-topbar-inner{padding:12px 16px}.rb-brand p,.rb-userbar .rb-user-info{display:none}.rb-status-pill{display:none}.rb-main{padding:16px}.rb-hero{padding:25px;border-radius:24px}.rb-hero-grid{display:block}.rb-hero h2{font-size:34px}.rb-hero:after{font-size:100px;right:10px;bottom:-15px}.rb-online-card{width:100%;margin-top:22px}.rb-stats,.rb-earn-grid{grid-template-columns:1fr}.rb-section-head{align-items:flex-start}.rb-route-grid{grid-template-columns:1fr}.rb-meta-grid{grid-template-columns:1fr 1fr}.rb-location-panel{display:block}.rb-big-online{width:100%;margin-top:18px}.rb-action-row{grid-template-columns:1fr}.rb-footer{display:block}.rb-operational{margin-top:12px}.rb-history-top,.rb-ride-top{display:block}.rb-status{display:inline-block;margin-top:10px}}
        @media(max-width:480px){.rb-topbar-inner{min-height:70px}.rb-brand-logo{width:42px;height:42px}.rb-brand h1{font-size:17px}.rb-avatar{width:37px;height:37px}.rb-hero h2{font-size:29px}.rb-meta-grid{grid-template-columns:1fr}.rb-ride-card,.rb-history-card,.rb-online-section{padding:18px}.rb-ride-card{border-radius:20px}}
      `}</style>

      {toast && (
        <div className="rb-toast-layer" aria-live="polite" aria-atomic="true">
          <div className={`rb-toast ${toast.type}`} role="status">
            <div className="rb-toast-icon">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : toast.type === "warning" ? "⚠" : "i"}
            </div>
            <div className="rb-toast-content">
              <p className="rb-toast-title">{toast.title}</p>
              <p className="rb-toast-message">{toast.message}</p>
            </div>
            <button className="rb-toast-close" onClick={closeToast} aria-label="Close notification">×</button>
            <div className="rb-toast-progress" />
          </div>
        </div>
      )}

      <header className="rb-topbar">
        <div className="rb-topbar-inner">
          <div className="rb-brand">
            <div className="rb-brand-logo">🏍️</div>
            <div>
              <h1>RideBack</h1>
              <p>Rider Portal · Smart returns</p>
            </div>
          </div>

          <div className="rb-userbar">
            <div className="rb-status-pill">
              <span className={`rb-status-dot ${isOnline ? "online" : ""}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
            <div className="rb-user-info">
              <div className="rb-user-name">{user.name || "Rider"}</div>
              <div className="rb-user-role">RideBack Rider</div>
            </div>
            <div className="rb-avatar">{firstLetter}</div>
            <button className="rb-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="rb-layout">
        <aside className="rb-sidebar">
          <div className="rb-sidebar-card">
            <div className="rb-side-label">Navigation</div>
            <button className="rb-side-btn active" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>🏠 Dashboard</button>
            <button className="rb-side-btn" onClick={() => document.getElementById("ride-requests")?.scrollIntoView({behavior:"smooth"})}>📋 Ride Requests</button>
            <button className="rb-side-btn" onClick={() => document.getElementById("online-section")?.scrollIntoView({behavior:"smooth"})}>🟢 Availability</button>
            <button className="rb-side-btn" onClick={() => document.getElementById("history")?.scrollIntoView({behavior:"smooth"})}>📊 Ride History</button>
            <div className="rb-side-profile">
              <div className="rb-side-avatar">{firstLetter}</div>
              <div><strong>{user.name || "Rider"}</strong><span>Make every return count</span></div>
            </div>
          </div>
        </aside>

        <main className="rb-main">
          <div className="rb-container">
            <section className="rb-hero">
              <div className="rb-hero-grid">
                <div>
                  <div className="rb-eyebrow">🏍️ RideBack Rider</div>
                  <h2>Turn your return trip<br />into an opportunity.</h2>
                  <p>Complete your delivery, share your location and connect with passengers travelling your way. Every empty return can become a smarter ride.</p>
                </div>
                <div className="rb-online-card">
                  <small>Current availability</small>
                  <div className="rb-online-state"><span className={`dot ${isOnline ? "online" : ""}`} />{isOnline ? "Online" : "Offline"}</div>
                  <button className={`rb-btn ${isOnline ? "rb-btn-offline" : "rb-btn-online"}`} onClick={toggleOnlineStatus} disabled={loading}>
                    {loading ? "Updating..." : isOnline ? "🔴 Go Offline" : "🟢 Go Online"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rb-stats">
              <div className="rb-stat"><div className="rb-stat-label">Pending Requests</div><div className="rb-stat-value">{pendingRides}</div><div className="rb-stat-icon">🔔</div></div>
              <div className="rb-stat"><div className="rb-stat-label">Active Rides</div><div className="rb-stat-value">{acceptedRides}</div><div className="rb-stat-icon">🛵</div></div>
              <div className="rb-stat"><div className="rb-stat-label">Completed Rides</div><div className="rb-stat-value">{completedRides}</div><div className="rb-stat-icon">🏁</div></div>
            </section>

            <div className="rb-tip"><span>💡</span><div><strong>RideBack tip:</strong> Go online after completing your food delivery. Your real GPS location will be shared with passengers looking for a ride.</div></div>

            <section className="rb-section">
              <div className="rb-section-head">
                <div><div className="rb-section-kicker">RIDER EARNINGS</div><h2>Earnings Overview</h2></div>
                <button className="rb-refresh" onClick={fetchRideHistory} disabled={historyLoading}>{historyLoading ? "Loading..." : "↻ Refresh"}</button>
              </div>
              <div className="rb-earn-grid">
                <div className="rb-card rb-earn-card"><div><div className="rb-earn-label">Total Earnings</div><div className="rb-earn-value" style={{color:"#059669"}}>₹{totalEarnings.toFixed(2)}</div></div><div className="rb-icon-box">💰</div></div>
                <div className="rb-card rb-earn-card"><div><div className="rb-earn-label">Completed Rides</div><div className="rb-earn-value">{completedRidesCount}</div></div><div className="rb-icon-box" style={{background:"#eff6ff"}}>🏁</div></div>
                <div className="rb-card rb-earn-card"><div><div className="rb-earn-label">Average Per Ride</div><div className="rb-earn-value">₹{completedRidesCount > 0 ? (totalEarnings/completedRidesCount).toFixed(2) : "0.00"}</div></div><div className="rb-icon-box" style={{background:"#fffbeb"}}>📈</div></div>
              </div>
            </section>

            <section id="history" className="rb-section">
              <div className="rb-section-head"><div><div className="rb-section-kicker">RIDE HISTORY</div><h2>Previous Rides</h2></div></div>
              {rideHistory.length === 0 ? (
                <div className="rb-card rb-empty"><div className="rb-empty-icon">📋</div><h3>No ride history</h3><p>Your completed rides will appear here after you finish passenger trips.</p></div>
              ) : (
                rideHistory.map((ride) => (
                  <div className="rb-card rb-history-card" key={ride.id}>
                    <div className="rb-history-top">
                      <div><div className="rb-muted">BOOKING #{ride.id}</div><div className="rb-title">{ride.passenger_name}</div><div className="rb-muted">📞 {ride.passenger_phone}</div></div>
                      <span className={`rb-status ${ride.status}`}>● {ride.status}</span>
                    </div>
                    <div className="rb-route-box"><div className="rb-route-grid"><div><div className="rb-route-label">PICKUP</div><div className="rb-route-value">📍 {ride.pickup_location}</div></div><div><div className="rb-route-label">DESTINATION</div><div className="rb-route-value">🏁 {ride.drop_location}</div></div></div></div>
                    <div className="rb-meta-grid">
                      <div className="rb-meta"><div className="rb-route-label">DISTANCE</div><strong>{ride.distance_km ? `${ride.distance_km} km` : "—"}</strong></div>
                      <div className="rb-meta"><div className="rb-route-label">FARE</div><strong>{ride.final_fare ? `₹${Number(ride.final_fare).toFixed(2)}` : "—"}</strong></div>
                      <div className="rb-meta"><div className="rb-route-label">PAYMENT</div><strong style={{textTransform:"capitalize"}}>{ride.payment_method || "—"}</strong></div>
                      <div className="rb-meta"><div className="rb-route-label">PAYMENT STATUS</div><strong style={{color:ride.payment_status === "paid" ? "#059669" : "#ca8a04",textTransform:"capitalize"}}>{ride.payment_status || "pending"}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section id="online-section" className="rb-section">
              <div className="rb-section-head"><div><div className="rb-section-kicker">RIDER AVAILABILITY</div><h2>Share Your Location</h2></div></div>
              <div className="rb-card rb-online-section">
                <div className="rb-location-panel">
                  <div style={{flex:1}}>
                    <div className="rb-location-title"><div className="rb-icon-box">📍</div><div><h3>Let passengers discover you</h3><p>Use real GPS after your delivery so nearby passengers can find you.</p></div></div>
                    {currentLocation && <div className="rb-location-value">📍 Current GPS: {currentLocation}</div>}
                  </div>
                  <button className={`rb-btn rb-big-online ${isOnline ? "rb-btn-offline" : "rb-accept"}`} onClick={toggleOnlineStatus} disabled={loading}>{loading ? "Updating..." : isOnline ? "🔴 Go Offline" : "🟢 Go Online"}</button>
                </div>
              </div>
            </section>

            <section id="ride-requests" className="rb-section">
              <div className="rb-section-head"><div><div className="rb-section-kicker">PASSENGER REQUESTS</div><h2>Ride Requests</h2></div><button className="rb-refresh" onClick={fetchRides}>↻ Refresh</button></div>
              {rides.length === 0 ? (
                <div className="rb-card rb-empty"><div className="rb-empty-icon">🛵</div><h3>No ride requests yet</h3><p>Go online and wait for passengers travelling in your direction. New requests will appear here.</p></div>
              ) : (
                rides.map((ride) => (
                  <div className="rb-card rb-ride-card" key={ride.id}>
                    <div className="rb-ride-top">
                      <div className="rb-passenger"><div className="rb-passenger-avatar">👤</div><div><h3>{ride.passenger_name}</h3><div className="rb-muted">Passenger request · Booking #{ride.id}</div></div></div>
                      <span className={`rb-status ${ride.status}`}>● {ride.status}</span>
                    </div>

                    <div className="rb-route-box">
                      <div style={{display:"flex",gap:16}}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:4}}><span style={{width:11,height:11,borderRadius:"50%",background:"#22c55e",display:"block"}}/><span style={{width:2,height:45,background:"#cbd5e1",display:"block"}}/><span style={{width:11,height:11,borderRadius:"50%",background:"#ef4444",display:"block"}}/></div>
                        <div style={{display:"grid",gap:18,flex:1}}><div><div className="rb-route-label">PICKUP</div><div className="rb-route-value">{ride.pickup_location}</div></div><div><div className="rb-route-label">DESTINATION</div><div className="rb-route-value">{ride.drop_location}</div></div></div>
                      </div>
                    </div>

                    <div className="rb-map-wrap">
                      <RiderMap riderLocation={currentLocation} pickupLocation={ride.pickup_location} dropLocation={ride.drop_location} pickupLat={ride.pickup_lat} pickupLng={ride.pickup_lng} dropLat={ride.drop_lat} dropLng={ride.drop_lng} />
                    </div>

                    <div className="rb-meta-grid">
                      <div className="rb-meta"><div className="rb-route-label">PASSENGERS</div><strong>👥 {ride.passengers}</strong></div>
                      <div className="rb-meta"><div className="rb-route-label">BOOKING</div><strong>#{ride.id}</strong></div>
                      {ride.distance_km && <div className="rb-meta"><div className="rb-route-label">DISTANCE</div><strong>{ride.distance_km} km</strong></div>}
                      {ride.final_fare && <div className="rb-meta"><div className="rb-route-label">FARE</div><strong>₹{Number(ride.final_fare).toFixed(2)}</strong></div>}
                    </div>

                    {ride.status === "pending" && <div className="rb-action-row"><button className="rb-btn rb-accept" onClick={() => handleAcceptRide(ride.id)}>✓ Accept Ride</button><button className="rb-btn rb-reject" onClick={() => handleRejectRide(ride.id)}>✕ Reject Ride</button></div>}
                    {ride.status === "accepted" && <div><div className="rb-message success"><strong>✓ Ride accepted</strong><br/>The passenger is waiting for you. Start the ride when you begin the journey.</div><button className="rb-btn rb-start" onClick={() => startRide(ride.id)}>🛵 Start Ride</button></div>}
                    {ride.status === "ongoing" && <div><div className="rb-message info"><strong>🔵 Ride in progress</strong><br/>Take the passenger to the destination and complete the ride after reaching the destination.</div><button className="rb-btn rb-complete" onClick={() => completeRide(ride.id)}>🏁 Complete Ride</button></div>}
                    {ride.status === "completed" && <div className="rb-message info" style={{textAlign:"center",fontWeight:900}}>✓ Ride Completed Successfully</div>}
                    {ride.status === "rejected" && <div className="rb-message error" style={{textAlign:"center",fontWeight:900}}>Ride Request Rejected</div>}
                  </div>
                ))
              )}
            </section>

            <footer className="rb-footer">
              <div><p><strong>RideBack Rider</strong></p><small>Make every return journey count.</small></div>
              <div className="rb-operational"><i /> System operational</div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}