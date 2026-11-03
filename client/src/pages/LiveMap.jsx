// -------------------------------------------------------------------
// LiveMap (/live) — public real-time view of the active simulation.
// -------------------------------------------------------------------
// Reads the same live store as the admin control panel. When the admin
// starts, pauses or stops a shipment, this page updates instantly.
// -------------------------------------------------------------------

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/LiveTrackingContext";
import {
  positionAt,
  trailAt,
  SIM_BASE_DURATION_MS,
} from "../lib/liveTracking";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { formatDateTime } from "../utils/format";
import { DEFAULT_CENTER } from "../data/geo";
import "../styles/live.css";

const STATE_LABELS = {
  idle: "No active run",
  running: "Live now",
  paused: "Paused",
  stopped: "Stopped",
  completed: "Delivered",
};

function etaText(live) {
  if (live.status === "completed") return "Arrived";
  if (live.status === "idle") return "—";
  if (live.status === "stopped") return "Stopped";
  if (live.status === "paused") return "Paused";
  const duration =
    ((1 - live.progress) * SIM_BASE_DURATION_MS) / (Number(live.speed) || 1);
  const totalSeconds = Math.max(0, Math.ceil(duration / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function LiveMap() {
  const live = useLiveTracking();
  const hasRun = live.route.length > 0;

  const { points, trail, center } = useMemo(() => {
    if (!hasRun) {
      return { points: [], trail: null, center: DEFAULT_CENTER };
    }

    const position = positionAt(live.route, live.progress);
    const first = live.route[0];
    const last = live.route[live.route.length - 1];

    const markers = [
      {
        lat: first[0],
        lng: first[1],
        title: `Origin — ${live.origin}`,
        subtitle: "Parcel collected here",
        color: "#0b2d5c",
      },
      {
        lat: last[0],
        lng: last[1],
        title: `Destination — ${live.destination}`,
        subtitle: "Where the parcel is going",
        color: "#f5821f",
      },
    ];

    if (position) {
      markers.push({
        lat: position.lat,
        lng: position.lng,
        title: "Live position",
        subtitle: `${live.statusLabel} · ${Math.round(live.progress * 100)}% of the route`,
        color: "#16a34a",
        kind: "live",
      });
    }

    return {
      points: markers,
      trail: trailAt(live.route, live.progress),
      center: [first[0], first[1]],
    };
  }, [hasRun, live.route, live.progress, live.origin, live.destination, live.statusLabel]);

  const fillClass =
    live.status === "paused"
      ? "progress-fill is-paused"
      : live.progress >= 1
        ? "progress-fill is-done"
        : "progress-fill";

  return (
    <div className="page">
      <section className="live-hero">
        <div className="container live-hero-inner">
          <div>
            <span className="live-eyebrow">
              <Icon name="radar" size={15} /> Real-time operations
            </span>
            <h1>Live parcel map</h1>
            <p>
              Follow an active delivery as it moves between cities. Your
              operations team updates this map in real time — no refresh
              needed.
            </p>
          </div>

          <span className={`live-chip is-${live.status}`}>
            <span className="live-dot" />
            {STATE_LABELS[live.status] || "No active run"}
            {live.trackNumber ? ` · ${live.trackNumber}` : ""}
          </span>
        </div>
      </section>

      <section className="live-body">
        <div className="container">
          {!hasRun ? (
            <div className="live-empty card">
              <span className="live-empty-icon">
                <Icon name="map" size={30} />
              </span>
              <h2>No delivery is live right now</h2>
              <p>
                As soon as our operations team starts a route, the parcel will
                appear here and move across the map in real time. You can still
                look up any parcel with its tracking number.
              </p>
              <div className="live-actions">
                <Link to="/track" className="btn btn-primary">
                  <Icon name="search" size={16} /> Track a parcel
                </Link>
                <Link to="/contact" className="btn btn-outline">
                  <Icon name="headset" size={16} /> Contact support
                </Link>
              </div>
            </div>
          ) : (
            <div className="live-layout">
              <div className="live-map-card card">
                <MapView
                  points={points}
                  route={live.route}
                  trail={trail}
                  center={center}
                  zoom={6}
                  height={470}
                  follow={live.status === "running" || live.status === "paused"}
                  fit={live.status !== "running" && live.status !== "paused"}
                />
                <p className="live-map-note">
                  <span className="live-dot" /> Positions refresh automatically
                  every few seconds.
                </p>
              </div>

              <aside className="live-side">
                <div className="live-panel card">
                  <div className="live-panel-head">
                    <h2>{live.trackNumber || "Active shipment"}</h2>
                    <span className={`live-chip is-${live.status}`}>
                      <span className="live-dot" />
                      {STATE_LABELS[live.status]}
                    </span>
                  </div>

                  <div className="live-status-row">
                    <span className="live-status-name">{live.statusLabel}</span>
                    <span className="live-percent">
                      {Math.round(live.progress * 100)}%
                    </span>
                  </div>

                  <div className="progress-track" aria-hidden="true">
                    <div
                      className={fillClass}
                      style={{ width: `${live.progress * 100}%` }}
                    />
                  </div>

                  <div className="live-route">
                    <div className="live-stop">
                      <span className="live-stop-dot" />
                      <div>
                        <small>Collected from</small>
                        <strong>{live.origin || "—"}</strong>
                      </div>
                    </div>
                    <span className="live-stop-line" />
                    <div className="live-stop">
                      <span className="live-stop-dot end" />
                      <div>
                        <small>Delivering to</small>
                        <strong>{live.destination || "—"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="live-facts">
                    <div className="live-fact">
                      <span>ETA</span>
                      <strong>{etaText(live)}</strong>
                    </div>
                    <div className="live-fact">
                      <span>Speed</span>
                      <strong>{live.speed}×</strong>
                    </div>
                    <div className="live-fact">
                      <span>Distance</span>
                      <strong>
                        {live.distanceKm > 0 ? `${live.distanceKm} km` : "—"}
                      </strong>
                    </div>
                    <div className="live-fact">
                      <span>Last update</span>
                      <strong>
                        {live.updatedAt
                          ? formatDateTime(live.updatedAt)
                          : "Waiting"}
                      </strong>
                    </div>
                    <div className="live-fact">
                      <span>Started</span>
                      <strong>
                        {live.startedAt
                          ? formatDateTime(live.startedAt)
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="live-cta">
                    {live.trackNumber && (
                      <Link
                        to={`/track/${live.trackNumber}`}
                        className="btn btn-primary"
                      >
                        <Icon name="parcel" size={16} /> Open full tracking
                      </Link>
                    )}
                    <Link to="/contact" className="btn btn-outline">
                      <Icon name="chat" size={16} /> Ask a question
                    </Link>
                  </div>
                </div>

                <div className="card live-panel">
                  <h2>How the live map works</h2>
                  <p className="info-muted" style={{ margin: 0 }}>
                    Our operations team starts each route from the dispatch
                    dashboard. The map shows the parcel's current position,
                    progress and estimated arrival. Updates arrive automatically
                    every few seconds.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
