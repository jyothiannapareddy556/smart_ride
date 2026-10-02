import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// =====================================================
// FIX DEFAULT LEAFLET MARKER
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// =====================================================
// RIDER ICON - RED
// =====================================================

const riderIcon = L.divIcon({
  className: "rider-map-icon",
  html: `
    <div style="
      width: 46px;
      height: 46px;
      background: #059669;
      border: 4px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      font-size: 25px;
    ">
      🛵
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  popupAnchor: [0, -23],
});

// =====================================================
// PICKUP ICON - GREEN
// =====================================================

const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

// =====================================================
// DESTINATION ICON - BLUE
// =====================================================

const destinationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

// =====================================================
// PARSE COORDINATES
// =====================================================

const parseCoordinates = (location) => {
  if (!location) {
    return null;
  }

  // Array: [latitude, longitude]
  if (Array.isArray(location)) {
    if (location.length !== 2) {
      return null;
    }

    const lat = Number(location[0]);
    const lng = Number(location[1]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return [lat, lng];
  }

  // Object: { lat, lng }
  if (
    typeof location === "object" &&
    location.lat !== undefined &&
    location.lng !== undefined
  ) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return [lat, lng];
  }

  // String: "latitude,longitude"
  const value = String(location).trim();

  if (!value) {
    return null;
  }

  const parts = value.split(",");

  if (parts.length !== 2) {
    return null;
  }

  const lat = Number(parts[0].trim());
  const lng = Number(parts[1].trim());

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  if (
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
};

// =====================================================
// GEOCODE LOCATION
// =====================================================

const geocodeLocation = async (location) => {
  if (!location) {
    return null;
  }

  // First check if location is already coordinates
  const coordinates = parseCoordinates(location);

  if (coordinates) {
    return coordinates;
  }

  try {
    let searchLocation = String(location).trim();

    if (!searchLocation) {
      return null;
    }

    // Add India information for city names
    if (!searchLocation.toLowerCase().includes("india")) {
      searchLocation += ", Andhra Pradesh, India";
    }

    console.log(
      "GEOCODING LOCATION:",
      searchLocation
    );

    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(
        searchLocation
      )}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Geocoding failed: ${response.status}`
      );
    }

    const data = await response.json();

    console.log(
      "GEOCODING RESPONSE:",
      searchLocation,
      data
    );

    if (!data || data.length === 0) {
      console.warn(
        "LOCATION NOT FOUND:",
        searchLocation
      );

      return null;
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }

    return [lat, lng];
  } catch (error) {
    console.error(
      "GEOCODING ERROR:",
      error
    );

    return null;
  }
};

// =====================================================
// FIT MAP TO MARKERS
// =====================================================

function FitPassengerMap({
  riderCoords,
  pickupCoords,
  dropCoords,
}) {
  const map = useMap();

  useEffect(() => {
    const points = [
      riderCoords,
      pickupCoords,
      dropCoords,
    ].filter(Boolean);

    if (points.length === 0) {
      return;
    }

    // Only one location
    if (points.length === 1) {
      map.setView(points[0], 14);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      return;
    }

    // Multiple locations
    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [50, 50],
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [
    riderCoords,
    pickupCoords,
    dropCoords,
    map,
  ]);

  return null;
}

// =====================================================
// PASSENGER MAP
// =====================================================

const PassengerMap = ({
  riderLocation,
  pickupLocation,
  dropLocation,
}) => {
  // ===================================================
  // STATE
  // ===================================================

  const [riderCoords, setRiderCoords] =
    useState(null);

  const [pickupCoords, setPickupCoords] =
    useState(null);

  const [dropCoords, setDropCoords] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [route, setRoute] =
    useState([]);

    const [roadRoute, setRoadRoute] =
  useState([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

    const [riderEta, setRiderEta] = useState(null);

    const [riderDistance, setRiderDistance] = useState(null);

    const [riderStatus, setRiderStatus] = useState("on the way");

  // ===================================================
  // LOAD LOCATIONS
  // ===================================================

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);

        console.log(
          "PASSENGER MAP DATA:",
          {
            riderLocation,
            pickupLocation,
            dropLocation,
          }
        );

        // -----------------------------------------------
        // RIDER LOCATION
        // -----------------------------------------------

        if (riderLocation) {
          const rider =
            parseCoordinates(riderLocation);

          if (rider) {
            console.log(
              "RIDER COORDINATES:",
              rider
            );

            setRiderCoords(rider);
          } else {
            console.warn(
              "RIDER LOCATION IS NOT COORDINATES:",
              riderLocation
            );

            const rider =
              await geocodeLocation(
                riderLocation
              );

            if (rider) {
              setRiderCoords(rider);
            }
          }
        } else {
          setRiderCoords(null);
        }

        // -----------------------------------------------
        // PICKUP LOCATION
        // -----------------------------------------------

        if (pickupLocation) {
          const pickup =
            await geocodeLocation(
              pickupLocation
            );

          if (pickup) {
            console.log(
              "PICKUP COORDINATES:",
              pickup
            );

            setPickupCoords(pickup);
          } else {
            setPickupCoords(null);
          }
        } else {
          setPickupCoords(null);
        }

        // -----------------------------------------------
        // DESTINATION LOCATION
        // -----------------------------------------------

        if (dropLocation) {
          const drop =
            await geocodeLocation(
              dropLocation
            );

          if (drop) {
            console.log(
              "DESTINATION COORDINATES:",
              drop
            );

            setDropCoords(drop);
          } else {
            setDropCoords(null);
          }
        } else {
          setDropCoords(null);
        }
      } catch (error) {
        console.error(
          "MAP LOCATION ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [
    riderLocation,
    pickupLocation,
    dropLocation,
  ]);
// ===================================================
// CALCULATE RIDER ETA TO PICKUP
// ===================================================

useEffect(() => {
  if (!riderCoords || !pickupCoords) {
    setRiderEta(null);
    return;
  }

  const calculateETA = async () => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${riderCoords[1]},${riderCoords[0]};` +
        `${pickupCoords[1]},${pickupCoords[0]}` +
        `?overview=false`;

      const response = await axios.get(url);

      if (
        response.data &&
        response.data.code === "Ok" &&
        response.data.routes &&
        response.data.routes.length > 0
      ) {

        const distance =
          response.data.routes[0].distance;

        const distanceKm =
          Number((distance / 1000).toFixed(2));

        setRiderDistance(distanceKm);
        console.log(
          "RIDER DISTANCE:",
          distanceKm,
          "km"
        );

        if (distanceKm <= 0.2) {
            setRiderStatus("arrived");
          } else if (distanceKm <= 1) {
            setRiderStatus("approaching");
          } else {
            setRiderStatus("on the way");
          }

        const duration =
          response.data.routes[0].duration;

        const minutes = Math.max(
          1,
          Math.ceil(duration / 60)
        );

        setRiderEta(minutes);

        console.log(
          "RIDER ETA:",
          minutes,
          "minutes"
        );
      } else {
        setRiderEta(null);
      }
    } catch (error) {
      console.error(
        "ETA CALCULATION ERROR:",
        error
      );

      setRiderEta(null);
    }
  };

  // Calculate immediately
  calculateETA();

  
  // Refresh every 20 seconds

const interval = setInterval(() => {
  console.log("ETA TIMER RUNNING");
  calculateETA();
}, 20000);

return () => {
  console.log("ETA TIMER STOPPED");
  clearInterval(interval);
};
}, [riderCoords, pickupCoords]);

// ===================================================
// GET REAL ROAD ROUTE
// ===================================================

useEffect(() => {
  if (
    !riderCoords ||
    !pickupCoords ||
    !dropCoords
  ) {
    setRoadRoute([]);
    return;
  }

  const getRoadRoute = async () => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${riderCoords[1]},${riderCoords[0]};` +
        `${pickupCoords[1]},${pickupCoords[0]};` +
        `${dropCoords[1]},${dropCoords[0]}` +
        `?overview=full&geometries=geojson`;

      const response = await axios.get(url);

      if (
        response.data &&
        response.data.code === "Ok" &&
        response.data.routes &&
        response.data.routes.length > 0
      ) {
        const coordinates =
          response.data.routes[0]
            .geometry.coordinates;

        const leafletCoordinates =
          coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);

        setRoadRoute(leafletCoordinates);
      } else {
        setRoadRoute([]);
      }
    } catch (error) {
      console.error(
        "ROAD ROUTE ERROR:",
        error
      );

      setRoadRoute([]);
    }
  };

  getRoadRoute();
}, [
  riderCoords,
  pickupCoords,
  dropCoords,
]);

  // ===================================================
  // CREATE SIMPLE ROUTE LINE
  // ===================================================

  useEffect(() => {
    if (
      !riderCoords ||
      !pickupCoords ||
      !dropCoords
    ) {
      setRoute([]);
      return;
    }

    setRoute([
      riderCoords,
      pickupCoords,
      dropCoords,
    ]);
  }, [
    riderCoords,
    pickupCoords,
    dropCoords,
  ]);

  // ===================================================
  // MAP
  // ===================================================

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">

      {/* MAP CONTAINER */}

      <div className="w-full h-[450px]">

        <MapContainer
          center={[15.9129, 79.7400]}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >

          {/* OPEN STREET MAP */}

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* AUTOMATICALLY FIT MAP */}

          <FitPassengerMap
            riderCoords={riderCoords}
            pickupCoords={pickupCoords}
            dropCoords={dropCoords}
          />

          {/* =========================================
              RIDER MARKER
          ========================================= */}

          {riderCoords && (
            <Marker
              position={riderCoords}
              icon={riderIcon}
            >
              <Popup>
                <strong>
                  {riderStatus === "arrived"
                    ? "🔔 Rider has arrived!"
                    : riderStatus === "approaching"
                    ? "🛵 Rider is approaching"
                    : "🛵 Rider is on the way"}
                </strong>

                <br />

                {riderLocation || "Current location"}

                <br />
                <br />

                {riderDistance !== null
                  ? `📍 Distance: ${riderDistance} km`
                  : "📍 Calculating distance..."}

                <br />

                {riderEta
                  ? `⏱️ Rider will arrive in: ${riderEta} min`
                  : "⏱️ Calculating arrival time..."}
              </Popup>
            </Marker>
          )}

          {/* =========================================
              PICKUP MARKER
          ========================================= */}

          {pickupCoords && (
            <Marker
              position={pickupCoords}
              icon={pickupIcon}
            >
              <Popup>
                <strong>
                  🟢 Pickup
                </strong>

                <br />

                Pickup Location:

                <br />

                {pickupLocation}
              </Popup>
            </Marker>
          )}

          {/* =========================================
              DESTINATION MARKER
          ========================================= */}

          {dropCoords && (
            <Marker
              position={dropCoords}
              icon={destinationIcon}
            >
              <Popup>
                <strong>
                  🔵 Destination
                </strong>

                <br />

                Destination:

                <br />

                {dropLocation}
              </Popup>
            </Marker>
          )}

          {/* =========================================
              ROUTE LINE
          ========================================= */}

          {roadRoute.length >= 2 && (
            <Polyline
              positions={roadRoute}
              pathOptions={{
                color: "blue",
                weight: 5,
                opacity: 0.8,
              }}
            />
          )}

        </MapContainer>

      </div>

      {/* =============================================
          MAP STATUS
      ============================================= */}

      <div className="bg-white px-4 py-2 text-xs border-t">

        {loading && (
          <span className="text-slate-500">
            📍 Loading locations...
          </span>
        )}

        {!loading &&
          riderCoords &&
          pickupCoords &&
          dropCoords && (
            <span className="text-green-600">
              📍 Rider → Pickup → Destination
            </span>
          )}

        {!loading &&
          !riderCoords &&
          !pickupCoords &&
          !dropCoords && (
            <span className="text-red-500">
              ⚠️ Locations could not be found
            </span>
          )}

      </div>

    </div>
  );
};

export default PassengerMap;