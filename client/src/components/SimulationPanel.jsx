// -------------------------------------------------------------------
// SimulationPanel — admin control for the live tracking simulation.
// -------------------------------------------------------------------
// Start / pause / resume / stop / reset a parcel moving along a route.
// The same state is read by the public Live Map, so what the admin does
// here is visible on /live (and in a second tab) immediately.
// -------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/LiveTrackingContext";
import {
  buildRoute,
  positionAt,
  trailAt,
  SIM_BASE_DURATION_MS,
  SPEED_OPTIONS,
} from "../lib/liveTracking";
import { useAdminAccount } from "../lib/adminAccount";
import { DEFAULT_CENTER } from "../data/geo";
import MapView from "./MapView";
import Icon from "./Icon";

const STATE_LABELS = {
  idle: "Ready",
  running: "Simulation live",
  paused: "Paused",
  stopped: "Stopped",
  completed: "Delivered",
};

function formatEta(ms) {
  if (ms <= 0) return "Arrived";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function SimulationPanel({ shipments = [] }) {
  const live = useLiveTracking();
  const account = useAdminAccount();

  // Speed chosen before starting. While running we follow live.speed.
  const [speed, setSpeed] = useState(
    Number(account?.prefs?.defaultSpeed) || 2
  );
  const [choice, setChoice] = useState("");

  const defaultTracking = useMemo(() => {
    const preferred =
      shipments.find((s) => s.status === "In transit") ||
      shipments.find((s) => s.status !== "Delivered") ||
      shipments[0];
    return preferred?.trackingNumber || "";
  }, [shipments]);

  const selectedTracking = choice || live.trackNumber || defaultTracking;
  const selectedShipment = shipments.find(
    (s) => s.trackingNumber === selectedTracking
  );

  const isLive = live.route.length > 0;
  const route = isLive
    ? live.route
    : selectedShipment
      ? buildRoute(selectedShipment.origin, selectedShipment.destination)
      : [];

  const progress = isLive ? live.progress : 0;
  const livePosition = positionAt(route, progress);
  const trail = isLive ? trailAt(route, progress) : null;

  const originName = isLive ? live.origin : selectedShipment?.origin || "";
  const destinationName = isLive
    ? live.destination
    : selectedShipment?.destination || "";

  const canChoose =
    live.status === "idle" ||
    live.status === "stopped" ||
    live.status === "completed";

  const points = [];

  if (route.length > 0) {
    points.push(
      {
        lat: route[0][0],
        lng: route[0][1],
        title: `Origin — ${originName}`,
        subtitle: "Parcel collected here",
        color: "#0b2d5c",
      },
      {
        lat: route[route.length - 1][0],
        lng: route[route.length - 1][1],
        title: `Destination — ${destinationName}`,
        subtitle: "Where the parcel is going",
        color: "#f5821f",
      }
    );

    if (isLive && livePosition) {
      points.push({
        lat: livePosition.lat,
        lng: livePosition.lng,
        title: "Live position",
        subtitle: `${live.statusLabel} · ${Math.round(
          progress * 100
        )}% of the route`,
        color: "#16a34a",
        kind: "live",
      });
    }
  }

  const handleStart = () => {
    if (!selectedShipment) return;
    live.start({
      trackNumber: selectedShipment.trackingNumber,
      shipmentId: selectedShipment.id,
      origin: selectedShipment.origin,
      destination: selectedShipment.destination,
      speed: Number(speed),
    });
  };

  const handleSpeed = (value) => {
    setSpeed(value);
    if (live.status === "running" || live.status === "paused") {
      live.setSpeed(value);
    }
  };

  const remainingMs = isLive
    ? ((1 - progress) * SIM_BASE_DURATION_MS) / (Number(live.speed) || 1)
    : 0;

  const fillClass =
    live.status === "paused"
      ? "progress-fill is-paused"
      : progress >= 1
        ? "progress-fill is-done"
        : "progress-fill";

  return (
    <section className="admin-section card sim-panel">
      <div className="sim-head">
        <div>
          <h2>
            <Icon name="radar" size={18} /> Live tracking simulation
          </h2>
          <p className="info-muted">
            Launch a delivery and watch the parcel move on the public live map.
          </p>
        </div>
        <span className={`sim-state sim-${live.status}`}>
          <span className="live-dot" />
          {STATE_LABELS[live.status] || "Ready"}
        </span>
      </div>

      <div className="sim-grid">
        <div className="sim-map">
          <MapView
            points={points}
            route={route}
            trail={trail}
            follow={isLive}
            fit={!isLive}
            center={route[0] || DEFAULT_CENTER}
            zoom={6}
            height={300}
            emptyText="Choose a shipment to preview its route."
          />
        </div>

        <div className="sim-controls">
          <div className="sim-selects">
            <div className="form-group">
              <label htmlFor="sim-shipment">Shipment</label>
              <select
                id="sim-shipment"
                className="form-input"
                value={selectedTracking}
                onChange={(event) => setChoice(event.target.value)}
                disabled={shipments.length === 0 || !canChoose}
              >
                {shipments.length === 0 && (
                  <option value="">No shipments yet</option>
                )}
                {shipments.map((shipment) => (
                  <option
                    key={shipment.id}
                    value={shipment.trackingNumber}
                  >
                    {shipment.trackingNumber} — {shipment.destination}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sim-speed">Speed</label>
              <select
                id="sim-speed"
                className="form-input"
                value={isLive ? live.speed : speed}
                onChange={(event) => handleSpeed(Number(event.target.value))}
              >
                {SPEED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}×
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sim-status-row">
            <div>
              <p className="sim-status-label">
                {isLive ? live.statusLabel : "Awaiting start"}
              </p>
              <p className="info-muted sim-route">
                {originName || "—"} → {destinationName || "—"}
              </p>
            </div>
            <span className="sim-percent">{Math.round(progress * 100)}%</span>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div className={fillClass} style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="sim-meta">
            <span>
              ETA <strong>{isLive ? formatEta(remainingMs) : "—"}</strong>
            </span>
            <span>
              Speed <strong>{isLive ? `${live.speed}×` : `${speed}×`}</strong>
            </span>
            <span>
              Tracking{" "}
              <strong>{live.trackNumber || selectedTracking || "—"}</strong>
            </span>
          </div>

          <div className="sim-actions">
            {live.status === "running" && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={live.pause}
                >
                  <Icon name="minus" size={16} /> Pause
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={live.stop}
                >
                  Stop
                </button>
              </>
            )}

            {live.status === "paused" && (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={live.resume}
                >
                  <Icon name="bolt" size={16} /> Resume
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={live.stop}
                >
                  Stop
                </button>
              </>
            )}

            {(live.status === "idle" ||
              live.status === "stopped" ||
              live.status === "completed") && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStart}
                disabled={!selectedShipment}
              >
                <Icon name="radar" size={16} />
                {live.status === "idle" ? "Start simulation" : "Start again"}
              </button>
            )}

            {live.status !== "idle" && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={live.reset}
              >
                <Icon name="refresh" size={16} /> Reset
              </button>
            )}
          </div>

          <Link to="/live" className="sim-live-link">
            Open the public live map <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
