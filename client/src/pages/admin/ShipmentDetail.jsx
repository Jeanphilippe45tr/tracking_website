// -------------------------------------------------------------------
// ShipmentDetail (/admin/shipments/:trackingNumber)
// Shipment info + timeline + "Add tracking update" form.
// -------------------------------------------------------------------

import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getShipmentByTrackingNumber,
  updateShipment,
  deleteShipment,
} from "../../api/shipments";
import StatusBadge from "../../components/StatusBadge";
import Timeline from "../../components/Timeline";
import EventForm from "../../components/EventForm";
import Spinner from "../../components/Spinner";
import { formatDateTime, formatDate } from "../../utils/format";
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

  // ---------------- Edit shipment (PATCH) ----------------
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState(null);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditError("");
    setEditValues({
      senderName: shipment.senderName ?? "",
      receiverName: shipment.receiverName ?? "",
      receiverPhone: shipment.receiverPhone ?? "",
      origin: shipment.origin ?? "",
      destination: shipment.destination ?? "",
      weight: shipment.weight ?? "",
      description: shipment.description ?? "",
      serviceLevel: shipment.serviceLevel ?? "standard",
      carrier: shipment.carrier ?? "",
      cost: shipment.cost ?? "",
      scheduledDeliveryAt: shipment.scheduledDeliveryAt
        ? String(shipment.scheduledDeliveryAt).slice(0, 10)
        : "",
    });
    setEditing(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      await updateShipment(shipment.trackingNumber, {
        ...editValues,
        weight: Number(editValues.weight),
        cost: editValues.cost === "" ? null : Number(editValues.cost),
        scheduledDeliveryAt: editValues.scheduledDeliveryAt || null,
      });
      const fresh = await getShipmentByTrackingNumber(shipment.trackingNumber);
      setShipment(fresh);
      setEditing(false);
    } catch (err) {
      setEditError(err.message || "Could not save the changes.");
    } finally {
      setSaving(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    const ok = window.confirm(
      `Delete shipment ${shipment.trackingNumber}? This cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteShipment(shipment.trackingNumber);
      navigate("/admin/shipments");
    } catch (err) {
      setError(err.message || "Could not delete the shipment.");
      setDeleting(false);
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

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <Link to="/admin/shipments" className="link-btn">
            ← Back to shipments
          </Link>
          <h1 className="detail-tracking">{shipment.trackingNumber}</h1>
        </div>
        <div className="detail-head-actions">
          <StatusBadge status={shipment.status} />
          <button type="button" className="btn btn-sm btn-outline" onClick={startEdit}>
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </header>

      {editing && editValues && (
        <section className="admin-section card" style={{ marginBottom: "var(--space-4)" }}>
          <h2>Edit shipment</h2>
          {editError && (
            <div className="alert alert-error" role="alert">
              {editError}
            </div>
          )}
          {shipment.status === "Delivered" && (
            <p className="info-muted">
              Routes can no longer change: this shipment is delivered.
            </p>
          )}
          <form onSubmit={saveEdit}>
            <div className="detail-grid" style={{ gap: 0 }}>
              <div className="edit-fields">
                <div className="form-group">
                  <label htmlFor="e-senderName">Sender</label>
                  <input
                    id="e-senderName"
                    name="senderName"
                    className="form-input"
                    value={editValues.senderName}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-receiverName">Receiver</label>
                  <input
                    id="e-receiverName"
                    name="receiverName"
                    className="form-input"
                    value={editValues.receiverName}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-receiverPhone">Receiver phone</label>
                  <input
                    id="e-receiverPhone"
                    name="receiverPhone"
                    className="form-input"
                    value={editValues.receiverPhone}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                {["origin", "destination"].map((name) => (
                  <div className="form-group" key={name}>
                    <label htmlFor={`e-${name}`}>
                      {name === "origin" ? "Origin" : "Destination"}
                    </label>
                    <input
                      id={`e-${name}`}
                      name={name}
                      className="form-input"
                      value={editValues[name]}
                      onChange={handleEditChange}
                      disabled={shipment.status === "Delivered"}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor="e-weight">Weight (kg)</label>
                  <input
                    id="e-weight"
                    name="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    className="form-input"
                    value={editValues.weight}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-description">Description</label>
                  <input
                    id="e-description"
                    name="description"
                    className="form-input"
                    value={editValues.description ?? ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-serviceLevel">Service level</label>
                  <select
                    id="e-serviceLevel"
                    name="serviceLevel"
                    className="form-input"
                    value={editValues.serviceLevel}
                    onChange={handleEditChange}
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="e-carrier">Carrier</label>
                  <input
                    id="e-carrier"
                    name="carrier"
                    className="form-input"
                    value={editValues.carrier ?? ""}
                    onChange={handleEditChange}
                    placeholder="e.g. DHL"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-cost">Cost</label>
                  <input
                    id="e-cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={editValues.cost ?? ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="e-scheduledDeliveryAt">Delivery estimate</label>
                  <input
                    id="e-scheduledDeliveryAt"
                    name="scheduledDeliveryAt"
                    type="date"
                    className="form-input"
                    value={editValues.scheduledDeliveryAt ?? ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
            </div>
            <div className="contact-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

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
                <dt>Service level</dt>
                <dd style={{ textTransform: "capitalize" }}>
                  {shipment.serviceLevel || "standard"}
                </dd>
              </div>
              <div>
                <dt>Carrier</dt>
                <dd>{shipment.carrier || "—"}</dd>
              </div>
              <div>
                <dt>Cost</dt>
                <dd>
                  {shipment.cost != null ? `$${shipment.cost.toFixed(2)}` : "—"}
                </dd>
              </div>
              <div>
                <dt>Delivery estimate</dt>
                <dd>
                  {shipment.scheduledDeliveryAt
                    ? formatDate(shipment.scheduledDeliveryAt)
                    : "—"}
                </dd>
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
