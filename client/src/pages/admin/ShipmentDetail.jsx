// -------------------------------------------------------------------
// ShipmentDetail (/admin/shipments/:trackingNumber)
// Shipment info + courier assignment + timeline + add-update form.
// -------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getShipmentByTrackingNumber,
  updateShipment,
} from "../../api/shipments";
import { getCouriers } from "../../api/couriers";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import EventForm from "../../components/EventForm";
import Spinner from "../../components/Spinner";
import { formatDateTime } from "../../utils/format";
import "../../styles/admin.css";

function addressLine(parts) {
  return parts.filter(Boolean).join(", ");
}

export default function ShipmentDetail() {
  const { trackingNumber } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [couriers, setCouriers] = useState([]);
  const [courierId, setCourierId] = useState("");
  const [savingCourier, setSavingCourier] = useState(false);
  const [courierMessage, setCourierMessage] = useState("");
  const [courierError, setCourierError] = useState("");

  const loadShipment = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    try {
      const data = await getShipmentByTrackingNumber(trackingNumber);
      setShipment(data);
      setCourierId(data.deliveryPersonId ? String(data.deliveryPersonId) : "");
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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getCouriers();
        if (active) setCouriers(data);
      } catch {
        if (active) setCouriers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Called by EventForm after a successful add: we replace the shipment
  // with the updated one, so the timeline refreshes immediately.
  const handleEventAdded = (updated) => {
    setShipment(updated);
  };

  const handleAssignCourier = async () => {
    setSavingCourier(true);
    setCourierError("");
    setCourierMessage("");
    try {
      const updated = await updateShipment(shipment.trackingNumber, {
        deliveryPersonId: courierId ? Number(courierId) : null,
      });
      setShipment(updated);
      setCourierId(
        updated.deliveryPersonId ? String(updated.deliveryPersonId) : ""
      );
      setCourierMessage(
        updated.deliveryPerson
          ? `${updated.deliveryPerson.name} is now handling this shipment.`
          : "The delivery person was removed."
      );
    } catch (err) {
      setCourierError(
        err.response?.data?.message ||
          err.message ||
          "Could not update the delivery person."
      );
    } finally {
      setSavingCourier(false);
    }
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

  const activeCouriers = couriers.filter(
    (courier) =>
      courier.isActive !== false ||
      String(courier.id) === String(shipment.deliveryPersonId)
  );

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
                <dd>
                  {shipment.origin}
                  {addressLine([
                    shipment.originAddress,
                    shipment.originRegion,
                    shipment.originPostalCode,
                    shipment.originCountry,
                  ]) && (
                    <span className="detail-sub">
                      {addressLine([
                        shipment.originAddress,
                        shipment.originRegion,
                        shipment.originPostalCode,
                        shipment.originCountry,
                      ])}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>
                  {shipment.destination}
                  {addressLine([
                    shipment.destinationAddress,
                    shipment.destinationRegion,
                    shipment.destinationPostalCode,
                    shipment.destinationCountry,
                  ]) && (
                    <span className="detail-sub">
                      {addressLine([
                        shipment.destinationAddress,
                        shipment.destinationRegion,
                        shipment.destinationPostalCode,
                        shipment.destinationCountry,
                      ])}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {shipment.originLat !== null &&
                  shipment.originLng !== null ? (
                    <>
                      Origin {Number(shipment.originLat).toFixed(4)},{" "}
                      {Number(shipment.originLng).toFixed(4)}
                    </>
                  ) : (
                    "Origin not located"
                  )}
                  <span className="detail-sub">
                    {shipment.destinationLat !== null &&
                    shipment.destinationLng !== null
                      ? `Destination ${Number(
                          shipment.destinationLat
                        ).toFixed(4)}, ${Number(
                          shipment.destinationLng
                        ).toFixed(4)}`
                      : "Destination not located"}
                  </span>
                </dd>
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

        {/* ---------------- Right: courier + add update form ---------------- */}
        <div className="detail-right" id="add-update">
          <section className="admin-section card">
            <h2>Delivery person</h2>
            {shipment.deliveryPerson ? (
              <div className="courier-current">
                <span className="courier-avatar" aria-hidden="true">
                  {shipment.deliveryPerson.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{shipment.deliveryPerson.name}</strong>
                  {shipment.deliveryPerson.vehicle && (
                    <p className="info-muted">
                      {shipment.deliveryPerson.vehicle}
                    </p>
                  )}
                  {shipment.deliveryPerson.phone && (
                    <p className="info-muted">
                      {shipment.deliveryPerson.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="info-muted">
                No delivery person assigned to this shipment yet.
              </p>
            )}

            <div className="form-group" style={{ marginTop: "0.8rem" }}>
              <label htmlFor="courier-assign">Assign a courier</label>
              <select
                id="courier-assign"
                className="form-input"
                value={courierId}
                onChange={(event) => {
                  setCourierId(event.target.value);
                  setCourierMessage("");
                  setCourierError("");
                }}
              >
                <option value="">Not assigned</option>
                {activeCouriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                    {courier.isActive === false ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {courierError && (
              <div className="form-error" role="alert">
                {courierError}
              </div>
            )}
            {courierMessage && (
              <p className="form-success" role="status">
                {courierMessage}
              </p>
            )}

            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAssignCourier}
                disabled={savingCourier}
              >
                {savingCourier ? "Saving..." : "Save delivery person"}
              </button>
              <Link to="/admin/couriers" className="btn btn-outline">
                Manage couriers
              </Link>
            </div>
          </section>

          <EventForm
            trackingNumber={shipment.trackingNumber}
            onAdded={handleEventAdded}
          />
        </div>
      </div>
    </div>
  );
}
