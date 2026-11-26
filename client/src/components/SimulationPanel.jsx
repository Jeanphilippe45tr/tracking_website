// -------------------------------------------------------------------
// SimulationPanel — admin control for the live tracking simulations.
// -------------------------------------------------------------------
// The admin can start several parcels at the same time (each one appears
// on the public live map) and control every run separately: pause,
// resume, stop, remove, and change its speed — including much slower
// speeds for realistic deliveries.
// -------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/LiveTrackingContext";
import {
  DEFAULT_TRANSPORT_MODE,
  TRANSPORT_MODES,
  buildRoute,
  etaMsFor,
  LIVE_STATUS,
  transportModeById,
} from "../lib/liveTracking";
import { useAdminAccount } from "../lib/adminAccount";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_CENTER } from "../data/geo";
import MapView from "./MapView";
import Icon from "./Icon";

const ACTIVE_STATUSES = [LIVE_STATUS.RUNNING, LIVE_STATUS.PAUSED];

const STATE_LABELS = {
  [LIVE_STATUS.RUNNING]: "Live",
  [LIVE_STATUS.PAUSED]: "Paused",
  [LIVE_STATUS.STOPPED]: "Stopped",
  [LIVE_STATUS.COMPLETED]: "Delivered",
};

function formatEta(ms) {
  if (ms <= 0) return "Arrived";
  const totalSeconds = Math.ceil(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function errorText(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

// Show the exact saved coordinates so the admin can confirm that the point
// on the map is the point entered in the shipment form.
function coordText(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return "coordinates unavailable";
  }
  return `${a.toFixed(4)}, ${b.toFixed(4)}`;
}

function endpointPoints(run) {
  const first = run.route[0];
  const last = run.route[run.route.length - 1];
  const points = [
    {
      lat: first[0],
      lng: first[1],
      title: `Origin — ${run.origin || "pickup"}`,
      subtitle: run.trackNumber ? `Run ${run.trackNumber}` : undefined,
      color: run.color,
    },
    {
      lat: last[0],
      lng: last[1],
      title: `Destination — ${run.destination || "drop-off"}`,
      subtitle: run.trackNumber ? `Run ${run.trackNumber}` : undefined,
      color: run.color,
    },
  ];

  if (run.position && run.status !== LIVE_STATUS.COMPLETED) {
    points.push({
      lat: run.position.lat,
      lng: run.position.lng,
      title: run.trackNumber || `Run #${run.id}`,
      subtitle: `${run.statusLabel} · ${Math.round(run.progress * 100)}%`,
      color: run.color,
      kind: "live",
    });
  }

  return points;
}

export default function SimulationPanel({ shipments = [] }) {
  const live = useLiveTracking();
  const account = useAdminAccount();
  const { user } = useAuth();
  const preferredMode =
    user?.prefs?.defaultTransportMode || account?.prefs?.defaultTransportMode;

  const [transportMode, setTransportMode] = useState(
    transportModeById(preferredMode).id
  );

  const [choice, setChoice] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  const defaultTracking = useMemo(() => {
    const preferred =
      shipments.find((s) => s.status === "In transit") ||
      shipments.find((s) => s.status !== "Delivered") ||
      shipments[0];
    return preferred?.trackingNumber || "";
  }, [shipments]);

  const selectedTracking = choice || defaultTracking;
  const selectedShipment = shipments.find(
    (s) => s.trackingNumber === selectedTracking
  );

  const activeRuns = live.runs.filter((run) =>
    ACTIVE_STATUSES.includes(run.status)
  );
  const activeTrackNumbers = new Set(
    activeRuns.map((run) => String(run.trackNumber || "").toLowerCase())
  );

  // The preview route is only used while nothing is on the live map.
  const previewRoute = useMemo(
    () =>
      selectedShipment
        ? buildRoute(
            selectedShipment.origin,
            selectedShipment.destination,
            [selectedShipment.originLat, selectedShipment.originLng],
            [selectedShipment.destinationLat, selectedShipment.destinationLng]
          )
        : [],
    [selectedShipment]
  );

  const overlays = useMemo(() => {
    if (live.runs.length > 0) {
      return live.runs.map((run) => ({
        id: run.id,
        route: run.route,
        link: run.link,
        trail: run.trail,
        color: run.color,
        points: endpointPoints(run),
      }));
    }

    if (previewRoute.length === 0) return [];

    return [
      {
        id: "preview",
        route: previewRoute,
        link: [previewRoute[0], previewRoute[previewRoute.length - 1]],
        trail: [],
        color: "#94a3b8",
        points: [
          {
            lat: previewRoute[0][0],
            lng: previewRoute[0][1],
            title: `Origin — ${selectedShipment?.origin || ""}`,
            subtitle: "Preview",
            color: "#0b2d5c",
          },
          {
            lat: previewRoute[previewRoute.length - 1][0],
            lng: previewRoute[previewRoute.length - 1][1],
            title: `Destination — ${selectedShipment?.destination || ""}`,
            subtitle: "Preview",
            color: "#f5821f",
          },
        ],
      },
    ];
  }, [live.runs, previewRoute, selectedShipment]);

  const runningCount = live.runs.filter(
    (run) => run.status === LIVE_STATUS.RUNNING
  ).length;

  const act = async (key, action) => {
    setPending(key);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending("");
    }
  };

  const handleStart = () => {
    if (!selectedShipment) return;
    act("start", () =>
      live.start({
        trackNumber: selectedShipment.trackingNumber,
        shipmentId: selectedShipment.id,
        origin: selectedShipment.origin,
        destination: selectedShipment.destination,
        originLat: selectedShipment.originLat,
        originLng: selectedShipment.originLng,
        destinationLat: selectedShipment.destinationLat,
        destinationLng: selectedShipment.destinationLng,
        transportMode,
      })
    );
  };

  const handleTransport = (run, value) => {
    act(`mode-${run.id}`, () => live.setTransport(run.id, value));
  };

  return (
    <section className="admin-section card sim-panel">
      <div className="sim-head">
        <div>
          <h2>
            <Icon name="radar" size={18} /> Live tracking simulations
          </h2>
          <p className="info-muted">
            Start several parcels at once. Every run is visible on the public
            live map, on any device.
          </p>
        </div>
        <span
          className={`sim-state ${
            runningCount > 0
              ? "sim-running"
              : activeRuns.length > 0
                ? "sim-paused"
                : ""
          }`}
        >
          <span className="live-dot" />
          {runningCount > 0
            ? `${runningCount} live`
            : activeRuns.length > 0
              ? `${activeRuns.length} paused`
              : live.runs.length > 0
                ? `${live.runs.length} finished`
                : "Ready"}
        </span>
      </div>

      {error && (
        <div className="form-error sim-error" role="alert">
          {error}
        </div>
      )}

      <div className="sim-grid">
        <div className="sim-map">
          <MapView
            overlays={overlays}
            center={overlays[0]?.route?.[0] || DEFAULT_CENTER}
            zoom={6}
            height={320}
            follow={runningCount === 1}
            fit={runningCount !== 1}
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
                disabled={shipments.length === 0}
              >
                {shipments.length === 0 && (
                  <option value="">No shipments yet</option>
                )}
                {shipments.map((shipment) => {
                  const isActive = activeTrackNumbers.has(
                    String(shipment.trackingNumber).toLowerCase()
                  );
                  return (
                    <option
                      key={shipment.id}
                      value={shipment.trackingNumber}
                      disabled={isActive}
                    >
                      {shipment.trackingNumber} — {shipment.destination}
                      {isActive ? " (live)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sim-mode">Transport / real speed</label>
              <select
                id="sim-mode"
                className="form-input"
                value={transportMode}
                onChange={(event) => setTransportMode(event.target.value)}
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label} · {mode.speedKmh} km/h
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedShipment && (
            <p className="sim-coords sim-preview-coords">
              Map points: {coordText(selectedShipment.originLat, selectedShipment.originLng)}{" "}
              → {coordText(selectedShipment.destinationLat, selectedShipment.destinationLng)}
            </p>
          )}

          <div className="sim-start-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={!selectedShipment || pending !== ""}
            >
              <Icon name="radar" size={16} />
              {pending === "start" ? "Starting…" : "Start simulation"}
            </button>
            {live.runs.length > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => act("reset", () => live.reset())}
                disabled={pending !== ""}
              >
                <Icon name="refresh" size={16} /> Clear all
              </button>
            )}
          </div>

          <div className="sim-run-list">
            {live.runs.length === 0 && (
              <p className="info-muted sim-empty-note">
                Nothing is moving right now. Pick a shipment and start a run —
                it will appear on the live map immediately.
              </p>
            )}

            {live.runs.map((run) => {
              const isRunning = run.status === LIVE_STATUS.RUNNING;
              const isPaused = run.status === LIVE_STATUS.PAUSED;
              const canControl = isRunning || isPaused;
              const fillClass = isPaused
                ? "progress-fill is-paused"
                : run.progress >= 1
                  ? "progress-fill is-done"
                  : "progress-fill";

              return (
                <article
                  key={run.id}
                  className={`sim-run sim-run-${run.status}`}
                  style={{ "--run": run.color }}
                >
                  <div className="sim-run-head">
                    <span className="sim-run-dot" />
                    <div className="sim-run-title">
                      <strong>{run.trackNumber || `Run #${run.id}`}</strong>
                      <span className={`sim-state sim-${run.status}`}>
                        {STATE_LABELS[run.status] || run.status}
                      </span>
                    </div>
                    <span className="sim-run-percent">
                      {Math.round(run.progress * 100)}%
                    </span>
                  </div>

                  <p className="sim-route">
                    {run.origin || "—"} → {run.destination || "—"}
                  </p>
                  <p className="sim-coords">
                    {coordText(run.originLat, run.originLng)} → {coordText(run.destinationLat, run.destinationLng)}
                  </p>
                  <p className="sim-coords">
                    {Math.round(run.distanceKm || 0).toLocaleString()} km ·{" "}
                    {transportModeById(run.transportMode).label} at{" "}
                    {transportModeById(run.transportMode).speedKmh} km/h · full
                    trip {formatEta(run.durationMs)}
                  </p>

                  <div className="progress-track" aria-hidden="true">
                    <div
                      className={fillClass}
                      style={{ width: `${run.progress * 100}%` }}
                    />
                  </div>

                  <div className="sim-meta">
                    <span>
                      ETA{" "}
                      <strong>
                        {isRunning || isPaused
                          ? formatEta(etaMsFor(run))
                          : STATE_LABELS[run.status] || "—"}
                      </strong>
                    </span>
                    <span>
                      Courier{" "}
                      <strong>{run.courier?.name || "Unassigned"}</strong>
                    </span>
                    {run.courier?.phone && (
                      <span>
                        Phone <strong>{run.courier.phone}</strong>
                      </span>
                    )}
                  </div>

                  <div className="sim-run-actions">
                    <label className="sim-speed-label">
                      <span>Mode</span>
                      <select
                        className="form-input"
                        value={run.transportMode || DEFAULT_TRANSPORT_MODE}
                        onChange={(event) =>
                          handleTransport(run, event.target.value)
                        }
                        disabled={!canControl || pending !== ""}
                      >
                        {TRANSPORT_MODES.map((mode) => (
                          <option key={mode.id} value={mode.id}>
                            {mode.label} · {mode.speedKmh} km/h
                          </option>
                        ))}
                      </select>
                    </label>

                    {isRunning && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          act(`pause-${run.id}`, () => live.pause(run.id))
                        }
                        disabled={pending !== ""}
                      >
                        <Icon name="minus" size={14} /> Pause
                      </button>
                    )}

                    {isPaused && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          act(`resume-${run.id}`, () => live.resume(run.id))
                        }
                        disabled={pending !== ""}
                      >
                        <Icon name="bolt" size={14} /> Resume
                      </button>
                    )}

                    {canControl && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          act(`stop-${run.id}`, () => live.stop(run.id))
                        }
                        disabled={pending !== ""}
                      >
                        Stop
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        act(`remove-${run.id}`, () => live.remove(run.id))
                      }
                      disabled={pending !== ""}
                      title="Remove this run from the map"
                    >
                      <Icon name="close" size={14} /> Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <Link to="/live" className="sim-live-link">
            Open the public live map <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
