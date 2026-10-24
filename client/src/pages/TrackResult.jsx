// -------------------------------------------------------------------
// TrackResult — public tracking result page (/track/:trackingNumber).
// -------------------------------------------------------------------
// Handles three states: loading, not found (404) and success.
// -------------------------------------------------------------------

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getShipmentByTrackingNumber } from "../api/shipments";
import { useLiveTracking } from "../context/LiveTrackingContext";
import { positionAt, trailAt } from "../lib/liveTracking";
import StatusBadge from "../components/StatusBadge";
import ProgressStepper from "../components/ProgressStepper";
import Timeline from "../components/Timeline";
import Spinner from "../components/Spinner";
import SearchBox from "../components/SearchBox";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { formatDateTime } from "../utils/format";
import { coordsFor, DEFAULT_CENTER } from "../data/geo";
import { useBrand } from "../context/SettingsContext";
import "../styles/pages.css";
import "../styles/content.css";
import "../styles/live.css";

// The carriers we can show next to a shipment.
const CARRIERS = ["SwiftTrack Express", "SwiftTrack Standard", "DHL Express", "UPS", "FedEx"];

// A simple estimate of the delivery date, based on the status.
function estimateDelivery(shipment) {
  if (shipment.status === "Delivered") {
    return { label: "Delivered", date: formatDateTime(shipment.updatedAt) };
  }
  if (shipment.status === "Out for delivery") {
    return { label: "Today", date: "before 18:00" };
  }
  if (shipment.status === "Delayed") {
    return { label: "Delayed", date: "new date within 48h" };
  }
  const days = shipment.origin === shipment.destination ? 1 : 3;
  const date = new Date(
    new Date(shipment.updatedAt).getTime() + days * 24 * 60 * 60 * 1000
  );
  return { label: "Estimated", date: formatDateTime(date) };
}

export default function TrackResult() {
  const { trackingNumber } = useParams();
  const live = useLiveTracking();
  const brand = useBrand();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // We wrap the fetch in useCallback so we can reuse it (retry button).
  const loadShipment = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");

    try {
      const data = await getShipmentByTrackingNumber(trackingNumber);
      setShipment(data);
    } catch (err) {
      // 404 -> dedicated "not found" UI, anything else -> generic error.
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || "Could not load the shipment.");
      }
    } finally {
      setLoading(false);
    }
  }, [trackingNumber]);

  // Re-run whenever the tracking number in the URL changes.
  useEffect(() => {
    // This effect deliberately fetches from the API and sets state. It is
    // the normal "load data on mount / when the URL param changes" pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShipment();
    // Scroll to top when arriving on a new result.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [loadShipment]);

  // The map points: origin, destination and every scanned location.
  // If the admin simulation is running for THIS shipment, we also add the
  // moving live marker and the travelled part of the route.
  const mapData = useMemo(() => {
    if (!shipment) {
      return {
        points: [],
        route: null,
        trail: null,
        center: DEFAULT_CENTER,
        isLive: false,
      };
    }

    const liveForShipment =
      live.route.length > 0 && live.trackNumber === shipment.trackingNumber;

    const points = [];
    const origin = coordsFor(shipment.origin);
    const destination = coordsFor(shipment.destination);

    if (origin) {
      points.push({
        lat: origin[0],
        lng: origin[1],
        title: `Origin — ${shipment.origin}`,
        subtitle: "Parcel collected here",
        color: "#0b2d5c",
      });
    }
    if (destination) {
      points.push({
        lat: destination[0],
        lng: destination[1],
        title: `Destination — ${shipment.destination}`,
        subtitle: "Where the parcel is going",
        color: "#f5821f",
      });
    }

    // Intermediate scans become their own markers.
    shipment.events.forEach((event) => {
      const coords = coordsFor(event.location);
      if (!coords) return;
      points.push({
        lat: coords[0],
        lng: coords[1],
        title: event.location,
        subtitle: event.description,
        color: "#2563eb",
      });
    });

    let route = origin && destination ? [origin, destination] : null;
    let trail = null;

    if (liveForShipment) {
      route = live.route;
      trail = trailAt(live.route, live.progress);
      const position = positionAt(live.route, live.progress);
      if (position) {
        points.push({
          lat: position.lat,
          lng: position.lng,
          title: "Live position",
          subtitle: `${live.statusLabel} · ${Math.round(
            live.progress * 100
          )}% of the route`,
          color: "#16a34a",
          kind: "live",
        });
      }
    }

    return {
      points,
      route,
      trail,
      center: origin || destination || DEFAULT_CENTER,
      isLive: liveForShipment,
    };
  }, [shipment, live]);

  // Copy the tracking link so the recipient can open it too.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard not available (insecure context) — ignore silently.
    }
  };

  const eta = shipment ? estimateDelivery(shipment) : null;

  // -------------------- Loading --------------------
  if (loading) {
    return (
      <div className="page">
        <div className="container page-narrow">
          <Spinner label="Looking for your shipment..." />
        </div>
      </div>
    );
  }

  // -------------------- Not found --------------------
  if (notFound) {
    return (
      <div className="page">
        <div className="container page-narrow">
          <div className="notfound-card card">
            <span className="notfound-icon" aria-hidden="true">
              <Icon name="parcel" size={46} />
            </span>
            <h1>Shipment not found</h1>
            <p>
              We could not find a shipment with the tracking number{" "}
              <strong>{trackingNumber}</strong>. Please check the number and try
              again.
            </p>
            <ul className="notfound-tips">
              <li>
                <Icon name="check" size={15} /> The number always has 12
                characters and starts with <strong>TRK</strong>
              </li>
              <li>
                <Icon name="check" size={15} /> It may have been created a few
                hours ago — try again later
              </li>
              <li>
                <Icon name="check" size={15} /> Contact us and we will find it
                manually
              </li>
            </ul>
            <SearchBox size="small" placeholder="Try another number" />
            <Link to="/" className="btn btn-outline">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- Generic error --------------------
  if (error) {
    return (
      <div className="page">
        <div className="container page-narrow">
          <div className="alert alert-error" role="alert">
            {error}
          </div>
          <button type="button" className="btn btn-primary" onClick={loadShipment}>
            <Icon name="refresh" size={16} /> Try again
          </button>
        </div>
      </div>
    );
  }

  // -------------------- Success --------------------
  return (
    <div className="page">
      <div className="container">
        {/* ---------------- HEADER ---------------- */}
        <div className="track-header card">
          <div className="track-header-top">
            <div>
              <p className="track-label">Tracking number</p>
              <h1 className="track-number">{shipment.trackingNumber}</h1>
              <p className="track-updated">
                <Icon name="refresh" size={14} /> Last update:{" "}
                {formatDateTime(shipment.updatedAt)}
              </p>
            </div>
            <div className="track-header-side">
              {mapData.isLive && (
                <span className={`live-inline is-${live.status}`}>
                  <span className="live-dot" />
                  Live · {live.statusLabel}
                </span>
              )}
              <StatusBadge status={shipment.status} />
              <span className="track-carrier">
                <Icon name="truck" size={15} /> {CARRIERS[shipment.id % CARRIERS.length]}
              </span>
            </div>
          </div>

          <div className="track-header-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleCopy}>
              <Icon name={copied ? "check" : "copy"} size={15} />
              {copied ? "Link copied" : "Copy tracking link"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
            >
              <Icon name="print" size={15} /> Print
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={loadShipment}>
              <Icon name="refresh" size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ---------------- PROGRESS ---------------- */}
        <ProgressStepper status={shipment.status} />

        {/* ---------------- SUMMARY + MAP ---------------- */}
        <div className="track-overview">
          <div className="track-summary">
            <div className="track-eta card">
              <span className="track-eta-icon">
                <Icon name="clock" size={22} />
              </span>
              <div>
                <p className="track-eta-label">{eta.label} delivery</p>
                <p className="track-eta-value">{eta.date}</p>
              </div>
            </div>

            <div className="track-route card">
              <div className="track-route-stop">
                <span className="track-route-dot start" />
                <div>
                  <small>Collected from</small>
                  <strong>{shipment.origin}</strong>
                </div>
              </div>
              <span className="track-route-line" />
              <div className="track-route-stop">
                <span className="track-route-dot end" />
                <div>
                  <small>Delivering to</small>
                  <strong>{shipment.destination}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="track-map card">
            <MapView
              points={mapData.points}
              route={mapData.route}
              trail={mapData.trail}
              center={mapData.center}
              zoom={6}
              height={330}
              follow={mapData.isLive}
              fit={!mapData.isLive}
            />
            <p className="track-map-caption">
              <Icon name="map" size={14} />{" "}
              {mapData.isLive
                ? "Live position — the map follows the parcel as it moves."
                : "Markers show the origin, the destination and every location scanned so far."}
            </p>
          </div>
        </div>

        {/* ---------------- DETAILS ---------------- */}
        <div className="info-grid">
          <div className="info-card card">
            <h3>Sender</h3>
            <p>{shipment.senderName}</p>
          </div>
          <div className="info-card card">
            <h3>Receiver</h3>
            <p>{shipment.receiverName}</p>
            {shipment.receiverPhone && (
              <p className="info-muted">{shipment.receiverPhone}</p>
            )}
          </div>
          <div className="info-card card">
            <h3>From</h3>
            <p>{shipment.origin}</p>
          </div>
          <div className="info-card card">
            <h3>To</h3>
            <p>{shipment.destination}</p>
          </div>
        </div>

        <div className="detail-meta card">
          <div>
            <span className="info-muted">Weight</span>
            <strong>{shipment.weight} kg</strong>
          </div>
          <div>
            <span className="info-muted">Description</span>
            <strong>{shipment.description || "—"}</strong>
          </div>
          <div>
            <span className="info-muted">Created</span>
            <strong>{formatDateTime(shipment.createdAt)}</strong>
          </div>
          <div>
            <span className="info-muted">Insured for</span>
            <strong>$10,000</strong>
          </div>
        </div>

        {/* ---------------- TIMELINE ---------------- */}
        <section className="timeline-section">
          <h2 className="section-title-sm">
            <Icon name="route" size={18} /> Tracking history
          </h2>
          <Timeline events={shipment.events} />
        </section>

        {/* ---------------- HELP ---------------- */}
        <div className="track-help card">
          <div>
            <h3>Something wrong with this delivery?</h3>
            <p>
              Our support team can check the file, change the address or
              explain a delay — just quote{" "}
              <strong>{shipment.trackingNumber}</strong>.
            </p>
          </div>
          <div className="track-help-actions">
            <Link to="/contact" className="btn btn-primary">
              <Icon name="chat" size={16} /> Contact support
            </Link>
            <a href={`tel:${brand.phoneHref}`} className="btn btn-outline">
              <Icon name="phone" size={16} /> {brand.phone}
            </a>
          </div>
        </div>

        <div className="track-footer">
          <SearchBox size="small" placeholder="Track another number" />
        </div>
      </div>
    </div>
  );
}
