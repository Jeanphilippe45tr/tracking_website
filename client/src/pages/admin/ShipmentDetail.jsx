// -------------------------------------------------------------------
// ShipmentDetail (/admin/shipments/:trackingNumber)
// Shipment info + timeline + "Add tracking update" form.
// -------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getShipmentByTrackingNumber } from "../../api/shipments";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import EventForm from "../../components/EventForm";
import Spinner from "../../components/Spinner";
import { formatDateTime } from "../../utils/format";
import "../../styles/admin.css";

export default function ShipmentDetail() {
  const { trackingNumber } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const loadShipment = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    try {
      const data = await getShipmentByTrackingNumber(trackingNumber);
      setShipment(data);
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message || "Could not load the shipment.");
    } finally {
      setLoading(false);
    }
  }, [trackingNumber]);

  useEffect(() => {
    // Loads the shipment when the page opens or the URL param changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShipment();
  }, [loadShipment]);

  // Called by EventForm after a successful add: we replace the shipment
  // with the updated one, so the timeline refreshes immediately.
  const handleEventAdded = (updated) => {
    setShipment(updated);
  };

  if (loading) return <Spinner label="Loading shipment..." />;

  if (notFound) {
    return (
      <div className="admin-page">
        <div className="notfound-card card">
          <h1>Shipment not found</h1>
          <p>
            No shipment with tracking number <strong>{trackingNumber}</strong>.
          </p>
          <Link to="/admin/shipments" className="btn btn-primary">
            Back to shipments
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="alert alert-error" role="alert">
          {error}
        </div>
        <button type="button" className="btn btn-primary" onClick={loadShipment}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <Link to="/admin/shipments" className="link-btn">
            ← Back to shipments
          </Link>
          <h1 className="detail-tracking">{shipment.trackingNumber}</h1>
        </div>
        <StatusBadge status={shipment.status} />
      </header>

      <div className="detail-grid">
        {/* ---------------- Left: info + timeline ---------------- */}
        <div className="detail-left">
          <section className="admin-section card">
            <h2>Shipment information</h2>
            <dl className="detail-list">
              <div>
                <dt>Sender</dt>
                <dd>{shipment.senderName}</dd>
              </div>
              <div>
                <dt>Receiver</dt>
                <dd>{shipment.receiverName}</dd>
              </div>
              <div>
                <dt>Receiver phone</dt>
                <dd>{shipment.receiverPhone}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{shipment.origin}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{shipment.destination}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{shipment.weight} kg</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{shipment.description || "—"}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(shipment.createdAt)}</dd>
              </div>
              <div>
                <dt>Last update</dt>
                <dd>{formatDateTime(shipment.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-section card">
            <h2>Tracking timeline</h2>
            <Timeline events={shipment.events} />
          </section>
        </div>

        {/* ---------------- Right: add update form ---------------- */}
        <div className="detail-right" id="add-update">
          <EventForm
            trackingNumber={shipment.trackingNumber}
            onAdded={handleEventAdded}
          />
        </div>
      </div>
    </div>
  );
}
