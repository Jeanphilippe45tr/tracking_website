// -------------------------------------------------------------------
// LiveMap (/live) — public real-time view of every active simulation.
// -------------------------------------------------------------------
// Reads the shared live context. When the admin starts, pauses or stops a
// shipment, this page updates automatically. Several parcels can be
// moving at the same time; each gets its own colour and card.
// -------------------------------------------------------------------

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/LiveTrackingContext";
import {
  etaMsFor,
  LIVE_STATUS,
  transportModeById,
} from "../lib/liveTracking";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { formatDateTime } from "../utils/format";
import { DEFAULT_CENTER } from "../data/geo";
import "../styles/live.css";

const STATE_LABELS = {
  [LIVE_STATUS.RUNNING]: "Live now",
  [LIVE_STATUS.PAUSED]: "Paused",
  [LIVE_STATUS.STOPPED]: "Stopped",
  [LIVE_STATUS.COMPLETED]: "Delivered",
};

function etaText(run) {
  if (run.status === LIVE_STATUS.COMPLETED) return "Arrived";
  if (run.status === LIVE_STATUS.STOPPED) return "Stopped";
  if (run.status === LIVE_STATUS.PAUSED) return "Paused";
  const totalSeconds = Math.max(0, Math.ceil(etaMsFor(run) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function speedText(run) {
  const mode = transportModeById(run?.transportMode);
  return `${mode.label} · ${mode.speedKmh} km/h`;
}

export default function LiveMap() {
  const live = useLiveTracking();
  const runs = live.runs;
  const activeRuns = runs.filter(
    (run) =>
      run.status === LIVE_STATUS.RUNNING || run.status === LIVE_STATUS.PAUSED
  );
  const hasRuns = runs.length > 0;

  const overlays = useMemo(
    () =>
      runs.map((run) => {
        const first = run.route[0];
        const last = run.route[run.route.length - 1];
        const points = [
          {
            lat: first[0],
            lng: first[1],
            title: `Origin — ${run.origin || "pickup"}`,
            subtitle: run.trackNumber || `Run #${run.id}`,
            color: run.color,
          },
          {
            lat: last[0],
            lng: last[1],
            title: `Destination — ${run.destination || "drop-off"}`,
            subtitle: run.trackNumber || `Run #${run.id}`,
            color: run.color,
          },
        ];

        if (run.position && run.status !== LIVE_STATUS.COMPLETED) {
          points.push({
            lat: run.position.lat,
            lng: run.position.lng,
            title: run.trackNumber || `Run #${run.id}`,
            subtitle: `${run.statusLabel} · ${Math.round(
              run.progress * 100
            )}% of the route`,
            color: run.color,
            kind: "live",
          });
        }

        return {
          id: run.id,
          route: run.route,
          link: run.link,
          trail: run.trail,
          color: run.color,
          points,
        };
      }),
    [runs]
  );

  const runningCount = runs.filter(
    (run) => run.status === LIVE_STATUS.RUNNING
  ).length;
  const followSingle = runningCount === 1 && runs.length === 1;
  const headerLabel =
    runningCount > 0
      ? `${runningCount} ${runningCount === 1 ? "delivery" : "deliveries"} live`
      : hasRuns
        ? `${runs.length} saved route${runs.length === 1 ? "" : "s"}`
        : "No active run";

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
              Follow active deliveries as they move between cities. Your
              operations team updates this map in real time — no refresh
              needed.
            </p>
          </div>

          <span
            className={`live-chip is-${
              runningCount > 0
                ? LIVE_STATUS.RUNNING
                : activeRuns.length > 0
                  ? LIVE_STATUS.PAUSED
                  : LIVE_STATUS.IDLE
            }`}
          >
            <span className="live-dot" />
            {headerLabel}
          </span>
        </div>
      </section>

      <section className="live-body">
        <div className="container">
          <div className="live-layout">
            <div className="live-map-card card">
              <MapView
                overlays={overlays}
                center={
                  overlays[0]?.route?.[0] || DEFAULT_CENTER
                }
                zoom={hasRuns ? 6 : 2}
                height={470}
                follow={followSingle}
                fit={!followSingle}
              />
              <p className="live-map-note">
                <span className="live-dot" />
                {hasRuns
                  ? ` ${runs.length} route${
                      runs.length === 1 ? "" : "s"
                    } shown. Positions refresh automatically every few seconds.`
                  : " No delivery is live right now — the map will update as soon as a route starts."}
              </p>
            </div>

            <aside className="live-side">
              {!hasRuns ? (
                <div className="live-empty card">
                  <span className="live-empty-icon">
                    <Icon name="map" size={30} />
                  </span>
                  <h2>No delivery is live right now</h2>
                  <p>
                    As soon as our operations team starts a route, the parcel
                    will appear here and move across the map in real time. You
                    can still look up any parcel with its tracking number.
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
                <div className="live-run-list">
                  {runs.map((run) => {
                    const fillClass =
                      run.status === LIVE_STATUS.PAUSED
                        ? "progress-fill is-paused"
                        : run.progress >= 1
                          ? "progress-fill is-done"
                          : "progress-fill";

                    return (
                      <article
                        key={run.id}
                        className="live-panel card live-run-card"
                        style={{ "--run": run.color }}
                      >
                        <div className="live-panel-head">
                          <h2>
                            {run.trackNumber ? (
                              <Link to={`/track/${run.trackNumber}`}>
                                {run.trackNumber}
                              </Link>
                            ) : (
                              `Run #${run.id}`
                            )}
                          </h2>
                          <span className={`live-chip is-${run.status}`}>
                            <span className="live-dot" />
                            {STATE_LABELS[run.status] || run.status}
                          </span>
                        </div>

                        <div className="live-status-row">
                          <span className="live-status-name">
                            {run.statusLabel}
                          </span>
                          <span className="live-percent">
                            {Math.round(run.progress * 100)}%
                          </span>
                        </div>

                        <div className="progress-track" aria-hidden="true">
                          <div
                            className={fillClass}
                            style={{ width: `${run.progress * 100}%` }}
                          />
                        </div>

                        <div className="live-route">
                          <div className="live-stop">
                            <span className="live-stop-dot" />
                            <div>
                              <small>Collected from</small>
                              <strong>{run.origin || "—"}</strong>
                            </div>
                          </div>
                          <span className="live-stop-line" />
                          <div className="live-stop">
                            <span className="live-stop-dot end" />
                            <div>
                              <small>Delivering to</small>
                              <strong>{run.destination || "—"}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="live-facts">
                          <div className="live-fact">
                            <span>ETA</span>
                            <strong>{etaText(run)}</strong>
                          </div>
                          <div className="live-fact">
                            <span>Speed</span>
                            <strong>{speedText(run)}</strong>
                          </div>
                          <div className="live-fact">
                            <span>Distance</span>
                            <strong>
                              {Math.round(run.distanceKm || 0).toLocaleString()} km
                            </strong>
                          </div>
                          <div className="live-fact">
                            <span>Courier</span>
                            <strong>{run.courier?.name || "Unassigned"}</strong>
                          </div>
                          <div className="live-fact">
                            <span>Updated</span>
                            <strong>
                              {run.updatedAt
                                ? formatDateTime(run.updatedAt)
                                : "Waiting"}
                            </strong>
                          </div>
                        </div>

                        <div className="live-cta">
                          {run.trackNumber && (
                            <Link
                              to={`/track/${run.trackNumber}`}
                              className="btn btn-primary"
                            >
                              <Icon name="parcel" size={16} /> Open full tracking
                            </Link>
                          )}
                          <Link to="/contact" className="btn btn-outline">
                            <Icon name="chat" size={16} /> Ask a question
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>

          {hasRuns && (
            <div className="card live-panel live-how">
              <h2>How the live map works</h2>
              <p className="info-muted" style={{ margin: 0 }}>
                Our operations team starts each route from the dispatch
                dashboard. Every active parcel appears with its own colour,
                current position, progress and estimated arrival. Updates
                arrive automatically every few seconds.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
