// -------------------------------------------------------------------
// MapView — a real interactive map (Leaflet + OpenStreetMap tiles).
// -------------------------------------------------------------------
// Leaflet is loaded from a CDN in index.html, so there is no extra npm
// dependency and no API key is needed. If the library cannot be loaded
// (offline, blocked CDN) we fall back to a static panel so the page
// still shows the information.
// -------------------------------------------------------------------

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { DEFAULT_CENTER } from "../data/geo";
import "../styles/map.css";

// The tile server used for the map background. Uses the free, key-less
// OpenStreetMap tile server (CARTO's CDN now requires an API key and
// returns an "API key required" placeholder tile without one).
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// A styled marker (a dot with a soft halo) instead of the default pin.
function makeIcon(color, isActive, isLive) {
  return window.L.divIcon({
    className: "map-pin-wrapper",
    html: `<span class="map-pin ${isActive ? "is-active" : ""} ${
      isLive ? "is-live" : ""
    }" style="--pin:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export default function MapView({
  points = [],
  route = null,
  trail = null,
  center = DEFAULT_CENTER,
  zoom = 6,
  height = 420,
  emptyText = "No location to display yet.",
  follow = false,
  fit = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // Leaflet is loaded from a CDN in index.html. It is a blocking script, so
  // it is already there when the app mounts. If it is missing we simply
  // show the fallback panel instead of the map.
  const leafletReady = typeof window !== "undefined" && Boolean(window.L);

  // Create the map once, then keep it in sync with the props.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (typeof window === "undefined" || !window.L) return;

    const L = window.L;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false, // do not hijack the page scroll
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // The map is created inside a hidden/animated container sometimes, so
    // we ask it to recompute its size on the next frames.
    const timer = setTimeout(() => map.invalidateSize(), 120);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw the markers and the route whenever the data changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = window.L;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = [];

    // Full route first (dashed), then the part already travelled (solid)
    // so the live map shows progress at a glance.
    if (route && route.length >= 2) {
      L.polyline(route, {
        color: "#94a3b8",
        weight: 3,
        opacity: 0.7,
        dashArray: "8 8",
      }).addTo(map);
      bounds.push(...route);
    }

    if (trail && trail.length >= 2) {
      L.polyline(trail, {
        color: "#f5821f",
        weight: 4,
        opacity: 0.95,
      }).addTo(map);
      bounds.push(...trail);
    }

    let livePoint = null;

    points.forEach((point, index) => {
      if (!point) return;
      const isLive = point.kind === "live";
      if (isLive) livePoint = point;

      const marker = L.marker([point.lat, point.lng], {
        icon: makeIcon(point.color || "#f5821f", index === 0 && !isLive, isLive),
        title: point.title,
      }).addTo(map);

      marker.bindPopup(
        `<strong>${point.title}</strong>` +
          (point.subtitle ? `<br/>${point.subtitle}` : "") +
          (point.hours ? `<br/><em>${point.hours}</em>` : "")
      );

      bounds.push([point.lat, point.lng]);
    });

    // The live map follows the moving parcel instead of refitting the
    // whole route on every tick (which would make the map jump).
    if (follow && livePoint) {
      map.panTo([livePoint.lat, livePoint.lng], {
        animate: true,
        duration: 0.5,
      });
    } else if (fit && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (fit && bounds.length === 1) {
      map.setView(bounds[0], 12);
    }
  }, [points, route, trail, follow, fit]);

  // Fallback panel when Leaflet could not be loaded.
  if (!leafletReady) {
    return (
      <div className="map-fallback" style={{ minHeight: height }}>
        <Icon name="map" size={34} />
        <p className="map-fallback-title">Interactive map unavailable</p>
        <p className="map-fallback-text">
          {emptyText} The map could not be loaded — check your connection. The
          location details are listed next to it.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="map-canvas"
      style={{ minHeight: height }}
      role="application"
      aria-label="Map of parcel locations"
    />
  );
}
