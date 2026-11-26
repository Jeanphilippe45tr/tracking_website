// -------------------------------------------------------------------
// ShipmentForm — reusable form to create a shipment (admin).
// -------------------------------------------------------------------
// Origin and destination are full addresses: the server geocodes them
// with OpenStreetMap, so any street / postal code / country combination
// is placed on the map. Manual coordinates are available as a fallback.
// The admin can also assign a delivery person right away.
// -------------------------------------------------------------------

import { useEffect, useState } from "react";
import { createShipment } from "../api/shipments";
import { getCouriers } from "../api/couriers";
import "../styles/forms.css";

// The initial (empty) form values.
const EMPTY = {
  senderName: "",
  receiverName: "",
  receiverPhone: "",
  origin: "",
  originAddress: "",
  originRegion: "",
  originPostalCode: "",
  originCountry: "",
  originLat: "",
  originLng: "",
  destination: "",
  destinationAddress: "",
  destinationRegion: "",
  destinationPostalCode: "",
  destinationCountry: "",
  destinationLat: "",
  destinationLng: "",
  deliveryPersonId: "",
  weight: "",
  description: "",
};

const COORD_PAIRS = [
  ["originLat", "originLng", "origin"],
  ["destinationLat", "destinationLng", "destination"],
];

export default function ShipmentForm({ onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [couriers, setCouriers] = useState([]);
  const [courierError, setCourierError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getCouriers();
        if (!active) return;
        setCouriers(data.filter((courier) => courier.isActive !== false));
      } catch {
        if (active) {
          setCourierError(
            "The delivery-person list could not be loaded. You can still create the shipment and assign someone later."
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

    COORD_PAIRS.forEach(([latKey, lngKey, label]) => {
      const hasLat = String(values[latKey]).trim() !== "";
      const hasLng = String(values[lngKey]).trim() !== "";
      if (hasLat !== hasLng) {
        next[hasLat ? lngKey : latKey] =
          `Enter both ${label} coordinates, or leave both empty.`;
        return;
      }
      if (!hasLat) return;

      const lat = Number(values[latKey]);
      const lng = Number(values[lngKey]);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        next[latKey] = "Latitude must be between -90 and 90.";
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        next[lngKey] = "Longitude must be between -180 and 180.";
      }
    });

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
        deliveryPersonId: values.deliveryPersonId
          ? Number(values.deliveryPersonId)
          : null,
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
  const field = (
    label,
    name,
    type = "text",
    placeholder = "",
    hint = ""
  ) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-input ${errors[name] ? "invalid" : ""}`}
        placeholder={placeholder}
        value={values[name]}
        onChange={handleChange}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        // Weight needs decimals; coordinates can be negative, so they use
        // step="any" and no minimum.
        step={type === "number" ? (name === "weight" ? "0.1" : "any") : undefined}
        min={type === "number" && name === "weight" ? "0.1" : undefined}
      />
      {hint && !errors[name] && <p className="field-hint">{hint}</p>}
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

      <h3 className="form-section-title">Sender &amp; receiver</h3>
      <div className="form-grid">
        {field("Sender name", "senderName", "text", "e.g. Jordan")}
        {field("Receiver name", "receiverName", "text", "e.g. Maya")}
        {field("Receiver phone", "receiverPhone", "tel", "+1 (555) 000-0000")}
        {field("Weight (kg)", "weight", "number", "2.5")}
      </div>

      <h3 className="form-section-title">Origin address</h3>
      <div className="form-grid">
        {field("City", "origin", "text", "e.g. New York")}
        {field(
          "Street address (optional)",
          "originAddress",
          "text",
          "350 5th Avenue"
        )}
        {field("State / region", "originRegion", "text", "e.g. NY")}
        {field("Postal code", "originPostalCode", "text", "e.g. 10118")}
        {field("Country", "originCountry", "text", "e.g. United States")}
      </div>

      <h3 className="form-section-title">Destination address</h3>
      <div className="form-grid">
        {field("City", "destination", "text", "e.g. London")}
        {field(
          "Street address (optional)",
          "destinationAddress",
          "text",
          "10 Downing Street"
        )}
        {field("State / region", "destinationRegion", "text", "e.g. Greater London")}
        {field("Postal code", "destinationPostalCode", "text", "e.g. SW1A 2AA")}
        {field("Country", "destinationCountry", "text", "e.g. United Kingdom")}
      </div>

      <p className="form-hint">
        Addresses are located automatically on the map. If the lookup is
        unavailable, add the latitude and longitude below.
      </p>

      <details className="form-advanced">
        <summary>Advanced: set coordinates manually</summary>
        <p className="field-hint">
          Leave both fields empty for automatic geocoding. Coordinates are
          optional, but latitude and longitude must be entered together.
        </p>
        <div className="form-grid">
          {field("Origin latitude", "originLat", "number", "40.7484")}
          {field("Origin longitude", "originLng", "number", "-73.9857")}
          {field("Destination latitude", "destinationLat", "number", "51.5072")}
          {field("Destination longitude", "destinationLng", "number", "-0.1276")}
        </div>
      </details>

      <h3 className="form-section-title">Delivery person</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="deliveryPersonId">Assign a courier (optional)</label>
          <select
            id="deliveryPersonId"
            name="deliveryPersonId"
            className="form-input"
            value={values.deliveryPersonId}
            onChange={handleChange}
          >
            <option value="">Not assigned yet</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
                {courier.vehicle ? ` — ${courier.vehicle}` : ""}
              </option>
            ))}
          </select>
          {courierError && <p className="field-hint">{courierError}</p>}
          {!courierError && couriers.length === 0 && (
            <p className="field-hint">
              No delivery people yet. Add one under Admin → Couriers.
            </p>
          )}
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
