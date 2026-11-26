// -------------------------------------------------------------------
// MapView — a real interactive map (Leaflet + OpenStreetMap tiles).
// -------------------------------------------------------------------
// Leaflet is installed from npm and bundled by Vite, so the map works
// even when a CDN is blocked by a firewall, VPN or browser extension.
// No API key is needed for the OpenStreetMap/Esri tiles.
//
// It accepts either a single route/trail/points set (tracking page, relay
// points) or an `overlays` array so several live runs can share one map.
// -------------------------------------------------------------------

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_CENTER } from "../data/geo";
import "../styles/map.css";

// Free, keyless tile servers. OpenStreetMap is the primary map; Esri is
// used only if OSM tiles fail to load. CARTO is deliberately not used:
// its public basemaps can return an "API KEY REQUIRED" image, which looks
// like a blank map but still counts as a successfully loaded tile.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const FALLBACK_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const FALLBACK_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, &copy; OpenStreetMap contributors';

// A styled marker (a dot with a soft halo) instead of the default pin.
function makeIcon(color, isActive, isLive) {
  return L.divIcon({
    className: "map-pin-wrapper",
    html: `<span class="map-pin ${isActive ? "is-active" : ""} ${
      isLive ? "is-live" : ""
    }" style="--pin:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function MapView({
  points = [],
  route = null,
  link = null,
  trail = null,
  overlays = null,
  center = DEFAULT_CENTER,
  zoom = 6,
  height = 420,
  follow = false,
  fit = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const lastFitKey = useRef("");

  // Create the map once, then keep it in sync with the props.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false, // do not hijack the page scroll
    });

    const tiles = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // If the OSM tiles are blocked (firewall, VPN, extension), switch
    // once to the Esri street map so the map still appears.
    let tileErrors = 0;
    let switched = false;
    tiles.on("tileerror", () => {
      tileErrors += 1;
      if (switched || tileErrors < 3) return;
      switched = true;
      map.removeLayer(tiles);
      L.tileLayer(FALLBACK_TILE_URL, {
        attribution: FALLBACK_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
    });

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

  // Draw the markers and the routes whenever the data changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds = [];
    // Several live runs -> one group per run. Otherwise fall back to the
    // single route/trail/points used by the tracking and relay pages.
    const groups =
      Array.isArray(overlays) && overlays.length > 0
        ? overlays
        : [{ route, link, trail, points, color: "#f5821f" }];

    let livePoint = null;

    groups.forEach((group) => {
      const color = group.color || "#f5821f";

      // Full route first (dashed), then the part already travelled
      // (solid) so the live map shows progress at a glance.
      if (group.route && group.route.length >= 2) {
        L.polyline(group.route, {
          color,
          weight: 2,
          opacity: 0.35,
          dashArray: "7 8",
        }).addTo(map);
        bounds.push(...group.route);
      }

      // Always show the direct line between the two saved endpoints. This
      // is the admin's origin → destination pair, independent of how far
      // the parcel has travelled or which way the route curves.
      if (Array.isArray(group.link) && group.link.length >= 2) {
        L.polyline(group.link, {
          color,
          weight: 2,
          opacity: 0.8,
        }).addTo(map);
        bounds.push(...group.link);
      }

      if (group.trail && group.trail.length >= 2) {
        L.polyline(group.trail, {
          color,
          weight: 4,
          opacity: 0.95,
        }).addTo(map);
        bounds.push(...group.trail);
      }

      const groupPoints = group.points || [];
      groupPoints.forEach((point, index) => {
        if (!point) return;
        const isLive = point.kind === "live";
        if (isLive) livePoint = point;

        const marker = L.marker([point.lat, point.lng], {
          icon: makeIcon(
            point.color || color,
            index === 0 && !isLive,
            isLive
          ),
          title: point.title,
        }).addTo(map);

        marker.bindPopup(
          `<strong>${escapeHtml(point.title)}</strong>` +
            (point.subtitle
              ? `<br/>${escapeHtml(point.subtitle)}`
              : "") +
            (point.hours ? `<br/><em>${escapeHtml(point.hours)}</em>` : "")
        );

        bounds.push([point.lat, point.lng]);
      });
    });

    // Fit only when the routes themselves change, not on every progress
    // tick, so several live runs do not make the map jump constantly.
    const fitKey = groups
      .map((group) => {
        const first = group.route?.[0];
        const last = group.route?.[group.route.length - 1];
        const pts = (group.points || [])
          .filter((point) => point && point.kind !== "live")
          .map((point) => `${point.lat},${point.lng}`);
        return [group.id || "", first, last, pts].flat().join("|");
      })
      .join("~");

    if (follow && livePoint) {
      // The live map follows the moving parcel instead of refitting.
      map.panTo([livePoint.lat, livePoint.lng], {
        animate: true,
        duration: 0.5,
      });
    } else if (fit && bounds.length > 1) {
      if (lastFitKey.current !== fitKey) {
        map.fitBounds(bounds, { padding: [40, 40] });
        lastFitKey.current = fitKey;
      }
    } else if (fit && bounds.length === 1) {
      if (lastFitKey.current !== fitKey) {
        map.setView(bounds[0], 12);
        lastFitKey.current = fitKey;
      }
    } else if (bounds.length === 0) {
      lastFitKey.current = "";
    }
  }, [points, route, link, trail, overlays, follow, fit]);

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
