// -------------------------------------------------------------------
// CreateShipment (/admin/shipments/new)
// Shows the generated tracking number with a "Copy" button on success.
// -------------------------------------------------------------------

import { useState } from "react";
import { Link } from "react-router-dom";
import ShipmentForm from "../../components/ShipmentForm";
import "../../styles/admin.css";

export default function CreateShipment() {
  // Holds the shipment returned by the API after a successful create.
  const [created, setCreated] = useState(null);
  // Feedback text for the Copy button.
  const [copied, setCopied] = useState(false);

  const handleCreated = (shipment) => {
    setCreated(shipment);
    setCopied(false);
  };

  // Copy the tracking number to the clipboard.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.trackingNumber);
      setCopied(true);
    } catch {
      // Clipboard can fail (e.g. insecure context) — tell the user.
      setCopied(false);
      alert("Copy failed. Please copy the number manually.");
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Create shipment</h1>
          <p className="info-muted">Fill in the details to register a parcel</p>
        </div>
        <Link to="/admin/shipments" className="btn btn-outline">
          Back to list
        </Link>
      </header>

      {/* Success panel with the generated tracking number. */}
      {created && (
        <div className="success-panel card" role="status">
          <span className="success-icon" aria-hidden="true">
            ✅
          </span>
          <div>
            <h2>Shipment created!</h2>
            <p>The tracking number for this shipment is:</p>
            <div className="tracking-copy">
              <code className="tracking-code">{created.trackingNumber}</code>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCopy}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <Link
              to={`/admin/shipments/${created.trackingNumber}`}
              className="link-btn"
            >
              Open shipment →
            </Link>
          </div>
        </div>
      )}

      <ShipmentForm onCreated={handleCreated} />
    </div>
  );
}
