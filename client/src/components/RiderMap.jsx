
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
// RIDER ICON
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
// PICKUP ICON
// =====================================================

const passengerIcon = new L.Icon({
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
// DESTINATION ICON
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
  if (!location) return null;

  if (Array.isArray(location)) {
    if (location.length !== 2) return null;

    const lat = Number(location[0]);
    const lng = Number(location[1]);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }

    return [lat, lng];
  }

  if (
    typeof location === "object" &&
    location.lat !== undefined &&
    location.lng !== undefined
  ) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      return null;
    }

    return [lat, lng];
  }

  const value =
    String(location).trim();

  if (!value) return null;

  const parts = value.split(",");

  if (parts.length !== 2) {
    return null;
  }

  const lat =
    Number(parts[0].trim());

  const lng =
    Number(parts[1].trim());

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  // Prevent invalid latitude/longitude

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
  if (!location) return null;

  const coordinates =
    parseCoordinates(location);

  if (coordinates) {
    return coordinates;
  }

  try {
    let searchLocation =
      String(location).trim();

    if (!searchLocation) {
      return null;
    }

    if (
      !searchLocation
        .toLowerCase()
        .includes("india")
    ) {
      searchLocation +=
        ", Andhra Pradesh, India";
    }

    console.log(
      "GEOCODING:",
      searchLocation
    );

    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(
        searchLocation
      )}`;

    const response =
      await fetch(url, {
        headers: {
          Accept:
            "application/json",
        },
      });

    if (!response.ok) {
      throw new Error(
        `Geocoding failed: ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data ||
      data.length === 0
    ) {
      console.warn(
        "LOCATION NOT FOUND:",
        searchLocation
      );

      return null;
    }

    const lat =
      Number(data[0].lat);

    const lng =
      Number(data[0].lon);

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
// FIT MAP
// =====================================================

function FitMap({
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

    if (points.length === 1) {
      map.setView(
        points[0],
        14
      );

      return;
    }

    const bounds =
      L.latLngBounds(points);

    map.fitBounds(
      bounds,
      {
        padding: [50, 50],
      }
    );

    // Leaflet sometimes needs this
    // when the container becomes visible.

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
// RIDER MAP
// =====================================================

export default function RiderMap({
  riderLocation,

  pickupLocation,

  dropLocation,

  pickupLat,

  pickupLng,

  dropLat,

  dropLng,
}) {
  const [riderCoords, setRiderCoords] =
    useState(null);

  const [pickupCoords, setPickupCoords] =
    useState(null);

  const [dropCoords, setDropCoords] =
    useState(null);

  const [loadingLocations, setLoadingLocations] =
    useState(true);

  const [route, setRoute] =
    useState([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

  // ===================================================
  // LOAD ALL LOCATIONS
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      setLoadingLocations(true);

      // -----------------------------------------------
      // RIDER LOCATION
      // -----------------------------------------------

      let riderResult =
        parseCoordinates(
          riderLocation
        );

      if (
        !riderResult &&
        riderLocation
      ) {
        riderResult =
          await geocodeLocation(
            riderLocation
          );
      }

      // -----------------------------------------------
      // PICKUP LOCATION
      // -----------------------------------------------

      let pickupResult = null;

      if (
        pickupLat !== undefined &&
        pickupLat !== null &&
        pickupLng !== undefined &&
        pickupLng !== null
      ) {
        const lat =
          Number(pickupLat);

        const lng =
          Number(pickupLng);

        if (
          !Number.isNaN(lat) &&
          !Number.isNaN(lng)
        ) {
          pickupResult =
            [lat, lng];
        }
      }

      if (
        !pickupResult &&
        pickupLocation
      ) {
        pickupResult =
          parseCoordinates(
            pickupLocation
          );
      }

      if (
        !pickupResult &&
        pickupLocation
      ) {
        pickupResult =
          await geocodeLocation(
            pickupLocation
          );
      }

      // -----------------------------------------------
      // DROP LOCATION
      // -----------------------------------------------

      let dropResult = null;

      if (
        dropLat !== undefined &&
        dropLat !== null &&
        dropLng !== undefined &&
        dropLng !== null
      ) {
        const lat =
          Number(dropLat);

        const lng =
          Number(dropLng);

        if (
          !Number.isNaN(lat) &&
          !Number.isNaN(lng)
        ) {
          dropResult =
            [lat, lng];
        }
      }

      if (
        !dropResult &&
        dropLocation
      ) {
        dropResult =
          parseCoordinates(
            dropLocation
          );
      }

      if (
        !dropResult &&
        dropLocation
      ) {
        dropResult =
          await geocodeLocation(
            dropLocation
          );
      }

      // -----------------------------------------------
      // UPDATE STATE
      // -----------------------------------------------

      if (!cancelled) {
        setRiderCoords(
          riderResult
        );

        setPickupCoords(
          pickupResult
        );

        setDropCoords(
          dropResult
        );

        setLoadingLocations(false);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };

  }, [
    riderLocation,
    pickupLocation,
    dropLocation,
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
  ]);

  // ===================================================
  // ROAD ROUTE
  // ===================================================

  useEffect(() => {
    const getRoute = async () => {
      /*
       * Route requires all three points.
       * But the MAP itself does NOT require
       * all three points.
       */

      if (
        !riderCoords ||
        !pickupCoords ||
        !dropCoords
      ) {
        setRoute([]);
        return;
      }

      try {
        setRouteLoading(true);

        const coordinates = [
          `${riderCoords[1]},${riderCoords[0]}`,
          `${pickupCoords[1]},${pickupCoords[0]}`,
          `${dropCoords[1]},${dropCoords[0]}`,
        ].join(";");

        const url =
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        console.log(
          "OSRM REQUEST:",
          url
        );

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `OSRM HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (
          data.routes &&
          data.routes.length > 0
        ) {
          const routeCoordinates =
            data.routes[0]
              .geometry
              .coordinates
              .map(
                ([lng, lat]) => [
                  lat,
                  lng,
                ]
              );

          setRoute(
            routeCoordinates
          );
        } else {
          setRoute([]);
        }

      } catch (error) {
        console.error(
          "ROUTE ERROR:",
          error
        );

        setRoute([]);

      } finally {
        setRouteLoading(false);
      }
    };

    getRoute();

  }, [
    riderCoords,
    pickupCoords,
    dropCoords,
  ]);

  // ===================================================
  // MAP CENTER
  // ===================================================

  const firstAvailableLocation =
    riderCoords ||
    pickupCoords ||
    dropCoords ||
    [15.9129, 79.7400];

  // ===================================================
  // MAP
  // ===================================================

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-white">

      <div className="w-full h-[450px]">

        <MapContainer
          center={firstAvailableLocation}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMap
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

                Current Location:

                <br />

                {riderLocation || "GPS"}

              </Popup>

            </Marker>
          )}

          {/* =========================================
              PICKUP MARKER
          ========================================= */}

          {pickupCoords && (
            <Marker
              position={pickupCoords}
              icon={passengerIcon}
            >

              <Popup>

                <strong>
                  🟢 Passenger Pickup
                </strong>

                <br />

                Pickup:

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
              ROUTE
          ========================================= */}

          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "blue",
                weight: 6,
                opacity: 0.8,
              }}
            />
          )}

        </MapContainer>

      </div>

      {/* =============================================
          SMALL MAP STATUS
      ============================================= */}

      <div className="bg-white px-4 py-2 text-xs border-t">

        {loadingLocations && (
          <span className="text-slate-500">
            📍 Loading locations...
          </span>
        )}

        {!loadingLocations &&
          routeLoading && (
            <span className="text-slate-500">
              🛣️ Finding road route...
            </span>
          )}

        {!loadingLocations &&
          !routeLoading &&
          route.length > 0 && (
            <span className="text-green-600 font-semibold">
              🛣️ Rider → Pickup → Destination
            </span>
          )}

        {!loadingLocations &&
          !routeLoading &&
          route.length === 0 && (
            <span className="text-slate-500">
              📍 Map ready
            </span>
          )}

      </div>

    </div>
  );
}

