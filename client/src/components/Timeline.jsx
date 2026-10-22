// -------------------------------------------------------------------
// Timeline — vertical list of tracking events (newest first).
// -------------------------------------------------------------------

import { formatDateTime } from "../utils/format";
import StatusBadge from "./StatusBadge";
import "../styles/timeline.css";

export default function Timeline({ events = [] }) {
  // Empty state: nice message instead of a blank box.
  if (!events.length) {
    return (
      <p className="empty-state">
        No tracking events recorded for this shipment yet.
      </p>
    );
  }

  // We don't assume the API already sorted them — sort newest first.
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <ol className="timeline">
      {sorted.map((event, index) => (
        <li
          key={event.id ?? `${event.status}-${index}`}
          // The first item (newest) gets an extra class for emphasis.
          className={`timeline-item ${index === 0 ? "latest" : ""}`}
        >
          <span className="timeline-marker" aria-hidden="true" />
          <div className="timeline-content">
            <div className="timeline-head">
              <StatusBadge status={event.status} />
              <time className="timeline-date" dateTime={event.createdAt}>
                {formatDateTime(event.createdAt)}
              </time>
            </div>
            <p className="timeline-location">
              <span aria-hidden="true">📍</span> {event.location || "Unknown location"}
            </p>
            {event.description && (
              <p className="timeline-desc">{event.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
