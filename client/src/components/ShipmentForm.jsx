// -------------------------------------------------------------------
// ShipmentForm — reusable form to create a shipment (admin).
// -------------------------------------------------------------------
// It gives the tracking number back to the parent via onCreated, so the
// parent can show it with a "Copy" button.
// -------------------------------------------------------------------

import { useState } from "react";
import { createShipment } from "../api/shipments";
import "../styles/forms.css";

// The initial (empty) form values.
const EMPTY = {
  senderName: "",
  receiverName: "",
  receiverPhone: "",
  origin: "",
  destination: "",
  weight: "",
  description: "",
  serviceLevel: "standard",
  carrier: "",
  cost: "",
  scheduledDeliveryAt: "",
};

export default function ShipmentForm({ onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Generic change handler: updates one field by name.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as soon as the user types again.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Front-end validation. Returns an object of field -> message.
  const validate = () => {
    const next = {};

    if (!values.senderName.trim()) next.senderName = "Sender name is required.";
    if (!values.receiverName.trim())
      next.receiverName = "Receiver name is required.";

    // Very light phone check: digits, spaces, +, - and ().
    if (!values.receiverPhone.trim()) {
      next.receiverPhone = "Receiver phone is required.";
    } else if (!/^[0-9+()\-\s]{6,20}$/.test(values.receiverPhone.trim())) {
      next.receiverPhone = "Enter a valid phone number.";
    }

    if (!values.origin.trim()) next.origin = "Origin city is required.";
    if (!values.destination.trim())
      next.destination = "Destination city is required.";

    const w = Number(values.weight);
    if (!values.weight) {
      next.weight = "Weight is required.";
    } else if (Number.isNaN(w) || w <= 0) {
      next.weight = "Weight must be a positive number.";
    }

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
      const shipment = await createShipment({
        ...values,
        weight: Number(values.weight),
        cost: values.cost === "" ? null : Number(values.cost),
        scheduledDeliveryAt: values.scheduledDeliveryAt || null,
      });
      setValues(EMPTY); // reset the form
      onCreated?.(shipment); // tell the parent (show tracking number)
    } catch (err) {
      setApiError(err.message || "Could not create the shipment.");
    } finally {
      setLoading(false);
    }
  };

  // Small helper to render a labelled input with its error message.
  const field = (label, name, type = "text", placeholder = "") => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-input ${errors[name] ? "invalid" : ""}`}
        placeholder={placeholder}
        value={values[name] ?? ""}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        // weight/cost need to allow decimals
        step={type === "number" ? "0.1" : undefined}
        min={type === "number" ? "0.1" : undefined}
      />
      {errors[name] && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form className="form card" onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="alert alert-error" role="alert">
          {apiError}
        </div>
      )}

      <div className="form-grid">
        {field("Sender name", "senderName", "text", "e.g. Jordan")}
        {field("Receiver name", "receiverName", "text", "e.g. Maya")}
        {field("Receiver phone", "receiverPhone", "tel", "+1 (555) 000-0000")}
        {field("Weight (kg)", "weight", "number", "2.5")}
        {field("Origin city", "origin", "text", "e.g. New York")}
        {field("Destination city", "destination", "text", "e.g. London")}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="serviceLevel">Service level</label>
          <select
            id="serviceLevel"
            name="serviceLevel"
            className="form-input"
            value={values.serviceLevel}
            onChange={handleChange}
          >
            <option value="standard">Standard (2–3 business days)</option>
            <option value="express">Express (next business day)</option>
          </select>
        </div>
        {field("Carrier (optional)", "carrier", "text", "e.g. DHL")}
        {field("Cost (optional)", "cost", "number", "e.g. 24.50")}
        <div className="form-group">
          <label htmlFor="scheduledDeliveryAt">Delivery estimate (optional)</label>
          <input
            id="scheduledDeliveryAt"
            name="scheduledDeliveryAt"
            type="date"
            className="form-input"
            value={values.scheduledDeliveryAt}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          className="form-input"
          rows="3"
          placeholder="e.g. Documents"
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
        {loading ? "Creating..." : "Create shipment"}
      </button>
    </form>
  );
}
