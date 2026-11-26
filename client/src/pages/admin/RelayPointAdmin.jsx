// -------------------------------------------------------------------
// RelayPointAdmin (/admin/relay-points)
// Create pickup/drop-off locations and hide them when they close.
// -------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createRelayPoint,
  deleteRelayPoint,
  getAdminRelayPoints,
  updateRelayPoint,
} from "../../api/shipments";
import MapView from "../../components/MapView";
import Spinner from "../../components/Spinner";
import { coordsFor, DEFAULT_CENTER, RELAY_COORDS } from "../../data/geo";
import "../../styles/admin.css";

const EMPTY = {
  name: "",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  hours: "",
  distance: "",
  lat: "",
  lng: "",
};

function errorText(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function pointCoords(point) {
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }
  return RELAY_COORDS[point.name] || coordsFor(point.city) || null;
}

export default function RelayPointAdmin() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [values, setValues] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPoints(await getAdminRelayPoints());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setValues(EMPTY);
    setEditingId(null);
    setFieldErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (values.name.trim().length < 2) {
      nextErrors.name = "Enter a name for the relay point.";
    }
    if (values.address.trim().length < 3) {
      nextErrors.address = "Enter the street address.";
    }
    if (values.city.trim().length < 2) {
      nextErrors.city = "Enter the city.";
    }

    const hasLat = String(values.lat).trim() !== "";
    const hasLng = String(values.lng).trim() !== "";
    if (hasLat !== hasLng) {
      nextErrors[hasLat ? "lng" : "lat"] =
        "Enter both coordinates, or leave both empty.";
    } else if (hasLat) {
      const lat = Number(values.lat);
      const lng = Number(values.lng);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        nextErrors.lat = "Latitude must be between -90 and 90.";
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        nextErrors.lng = "Longitude must be between -180 and 180.";
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId) {
        const updated = await updateRelayPoint(editingId, {
          ...values,
          distance: Number(values.distance) || 0,
        });
        setPoints((prev) =>
          prev.map((point) => (point.id === updated.id ? updated : point))
        );
        setNotice(`${updated.name} was updated.`);
      } else {
        const created = await createRelayPoint({
          ...values,
          distance: Number(values.distance) || 0,
        });
        setPoints((prev) => [...prev, created]);
        setNotice(`${created.name} is now visible to customers.`);
      }
      resetForm();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (point) => {
    setEditingId(point.id);
    setValues({
      name: point.name || "",
      address: point.address || "",
      city: point.city || "",
      region: point.region || "",
      postalCode: point.postalCode || "",
      country: point.country || "",
      hours: point.hours || "",
      distance: point.distance ?? "",
      lat: point.lat ?? "",
      lng: point.lng ?? "",
    });
    setFieldErrors({});
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleVisible = async (point) => {
    setPendingId(point.id);
    setError("");
    setNotice("");
    try {
      const updated = await updateRelayPoint(point.id, {
        isActive: !point.isActive,
      });
      setPoints((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(
        `${updated.name} is now ${updated.isActive ? "visible" : "hidden"}.`
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPendingId(null);
    }
  };

  const hide = async (point) => {
    setPendingId(point.id);
    setError("");
    setNotice("");
    try {
      await deleteRelayPoint(point.id);
      setPoints((prev) =>
        prev.map((item) =>
          item.id === point.id ? { ...item, isActive: false } : item
        )
      );
      setNotice(`${point.name} was hidden from customers.`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPendingId(null);
    }
  };

  const mapPoints = useMemo(
    () =>
      points
        .map((point) => {
          const coords = pointCoords(point);
          if (!coords) return null;
          return {
            lat: coords[0],
            lng: coords[1],
            title: point.name,
            subtitle: `${point.address}, ${point.city}`,
            hours: point.hours,
            color: point.isActive ? "#0f766e" : "#94a3b8",
          };
        })
        .filter(Boolean),
    [points]
  );

  const activeCount = points.filter((point) => point.isActive).length;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Relay points</h1>
          <p className="info-muted">
            Pickup and drop-off locations shown on the public relay-points
            page. New addresses are geocoded automatically.
          </p>
        </div>
        <span className="admin-count">
          {activeCount} visible · {points.length} total
        </span>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="admin-split">
        <section className="admin-section card">
          <h2>
            {editingId ? "Edit relay point" : "Add a relay point"}
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="relay-name">Name</label>
              <input
                id="relay-name"
                name="name"
                className={`form-input ${
                  fieldErrors.name ? "invalid" : ""
                }`}
                value={values.name}
                onChange={handleChange}
                placeholder="e.g. Relay Point Downtown"
                required
              />
              {fieldErrors.name && (
                <p className="field-error" role="alert">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="relay-address">Street address</label>
              <input
                id="relay-address"
                name="address"
                className={`form-input ${
                  fieldErrors.address ? "invalid" : ""
                }`}
                value={values.address}
                onChange={handleChange}
                placeholder="e.g. 245 Madison Avenue"
                required
              />
              {fieldErrors.address && (
                <p className="field-error" role="alert">
                  {fieldErrors.address}
                </p>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="relay-city">City</label>
                <input
                  id="relay-city"
                  name="city"
                  className={`form-input ${
                    fieldErrors.city ? "invalid" : ""
                  }`}
                  value={values.city}
                  onChange={handleChange}
                  placeholder="e.g. New York"
                  required
                />
                {fieldErrors.city && (
                  <p className="field-error" role="alert">
                    {fieldErrors.city}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="relay-region">State / region</label>
                <input
                  id="relay-region"
                  name="region"
                  className="form-input"
                  value={values.region}
                  onChange={handleChange}
                  placeholder="e.g. NY"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relay-postal">Postal code</label>
                <input
                  id="relay-postal"
                  name="postalCode"
                  className="form-input"
                  value={values.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 10016"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relay-country">Country</label>
                <input
                  id="relay-country"
                  name="country"
                  className="form-input"
                  value={values.country}
                  onChange={handleChange}
                  placeholder="e.g. United States"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relay-hours">Opening hours</label>
                <input
                  id="relay-hours"
                  name="hours"
                  className="form-input"
                  value={values.hours}
                  onChange={handleChange}
                  placeholder="Mon-Sat 08:00-20:00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="relay-distance">Distance (km)</label>
                <input
                  id="relay-distance"
                  name="distance"
                  type="number"
                  min="0"
                  step="0.1"
                  className="form-input"
                  value={values.distance}
                  onChange={handleChange}
                  placeholder="0.8"
                />
              </div>
            </div>

            <details className="form-advanced">
              <summary>Advanced: set coordinates manually</summary>
              <p className="field-hint">
                Leave empty to geocode the address automatically.
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="relay-lat">Latitude</label>
                  <input
                    id="relay-lat"
                    name="lat"
                    type="number"
                    step="any"
                    className={`form-input ${
                      fieldErrors.lat ? "invalid" : ""
                    }`}
                    value={values.lat}
                    onChange={handleChange}
                    placeholder="40.7502"
                  />
                  {fieldErrors.lat && (
                    <p className="field-error" role="alert">
                      {fieldErrors.lat}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="relay-lng">Longitude</label>
                  <input
                    id="relay-lng"
                    name="lng"
                    type="number"
                    step="any"
                    className={`form-input ${
                      fieldErrors.lng ? "invalid" : ""
                    }`}
                    value={values.lng}
                    onChange={handleChange}
                    placeholder="-73.9844"
                  />
                  {fieldErrors.lng && (
                    <p className="field-error" role="alert">
                      {fieldErrors.lng}
                    </p>
                  )}
                </div>
              </div>
            </details>

            <div className="detail-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add relay point"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-section card">
          <div className="admin-section-head">
            <h2>All locations</h2>
            <span className="admin-count">{points.length} total</span>
          </div>

          {loading ? (
            <Spinner label="Loading relay points..." />
          ) : points.length === 0 ? (
            <p className="empty-state">
              No relay points yet. Add the first one with the form.
            </p>
          ) : (
            <>
              <MapView
                points={mapPoints}
                center={mapPoints[0] ? [mapPoints[0].lat, mapPoints[0].lng] : DEFAULT_CENTER}
                zoom={mapPoints.length > 1 ? 4 : 11}
                height={240}
              />
              <div className="table-scroll" style={{ marginTop: "0.9rem" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Hours</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.id}>
                        <td data-label="Name">
                          <strong>{point.name}</strong>
                        </td>
                        <td data-label="Location">
                          {point.city}
                          <br />
                          <span className="info-muted">{point.address}</span>
                        </td>
                        <td data-label="Hours">{point.hours || "—"}</td>
                        <td data-label="Status">
                          <span
                            className={`status-pill ${
                              point.isActive ? "is-active" : "is-inactive"
                            }`}
                          >
                            {point.isActive ? "Visible" : "Hidden"}
                          </span>
                        </td>
                        <td data-label="Actions" className="cell-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => startEdit(point)}
                            disabled={pendingId === point.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              point.isActive
                                ? hide(point)
                                : toggleVisible(point)
                            }
                            disabled={pendingId === point.id}
                          >
                            {point.isActive ? "Hide" : "Show"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
