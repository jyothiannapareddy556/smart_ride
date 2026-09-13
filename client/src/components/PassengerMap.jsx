import React, { useEffect, useState } from "react";

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

const riderIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
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

  const [routeLoading, setRouteLoading] =
    useState(false);

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
                  🔴 Rider
                </strong>

                <br />

                Rider Location:

                <br />

                {riderLocation ||
                  "Current location"}
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

          {route.length >= 2 && (
            <Polyline
              positions={route}
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