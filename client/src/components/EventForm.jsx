// -------------------------------------------------------------------
// EventForm — form to add a tracking update to a shipment (admin).
// -------------------------------------------------------------------
// On success it calls onAdded(updatedShipment) so the parent page can
// refresh the timeline immediately.
// -------------------------------------------------------------------

import { useState } from "react";
import { addShipmentEvent, STATUSES } from "../api/shipments";
import "../styles/forms.css";

const EMPTY = { status: "In transit", location: "", description: "" };

export default function EventForm({ trackingNumber, onAdded }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!values.status) next.status = "Please choose a status.";
    if (!values.location.trim()) next.location = "Location is required.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setApiError("");

    try {
      const updated = await addShipmentEvent(trackingNumber, values);
      setValues(EMPTY); // reset
      onAdded?.(updated); // parent refreshes the timeline
    } catch (err) {
      setApiError(err.message || "Could not add the update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      <h3 className="form-title">Add tracking update</h3>

      {apiError && (
        <div className="alert alert-error" role="alert">
          {apiError}
        </div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            className={`form-input ${errors.status ? "invalid" : ""}`}
            value={values.status}
            onChange={handleChange}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="field-error" role="alert">
              {errors.status}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            className={`form-input ${errors.location ? "invalid" : ""}`}
            placeholder="e.g. Douala Hub"
            value={values.location}
            onChange={handleChange}
            aria-invalid={Boolean(errors.location)}
          />
          {errors.location && (
            <p className="field-error" role="alert">
              {errors.location}
            </p>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="event-description">Description (optional)</label>
        <textarea
          id="event-description"
          name="description"
          className="form-input"
          rows="2"
          placeholder="e.g. Arrived at the sorting centre"
          value={values.description}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Adding..." : "Add update"}
      </button>
    </form>
  );
}
