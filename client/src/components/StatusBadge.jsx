// -------------------------------------------------------------------
// StatusBadge — small coloured pill that shows a shipment status.
// -------------------------------------------------------------------
// The colour is driven by a CSS class per status (see styles/status.css)
// so we keep the exact allowed status strings as the source of truth.
// -------------------------------------------------------------------

import "../styles/status.css";

export default function StatusBadge({ status }) {
  if (!status) return null;

  // Turn "Out for delivery" into "status-out-for-delivery".
  const slug = status.toLowerCase().replace(/\s+/g, "-");

  return <span className={`status-badge status-${slug}`}>{status}</span>;
}
