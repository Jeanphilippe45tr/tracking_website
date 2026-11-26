// -------------------------------------------------------------------
// Couriers (/admin/couriers)
// Delivery people the admin can assign to shipments.
// -------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCourier,
  deleteCourier,
  getCouriers,
  updateCourier,
} from "../../api/couriers";
import Spinner from "../../components/Spinner";
import Icon from "../../components/Icon";
import "../../styles/admin.css";

const EMPTY = { name: "", phone: "", email: "", vehicle: "" };

function errorText(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function Couriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCouriers(await getCouriers());
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
      nextErrors.name = "Enter the delivery person's name.";
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId) {
        const updated = await updateCourier(editingId, values);
        setCouriers((prev) =>
          prev.map((courier) => (courier.id === updated.id ? updated : courier))
        );
        setNotice(`${updated.name} was updated.`);
      } else {
        const created = await createCourier(values);
        setCouriers((prev) => [...prev, created]);
        setNotice(`${created.name} can now be assigned to shipments.`);
      }
      resetForm();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (courier) => {
    setEditingId(courier.id);
    setValues({
      name: courier.name || "",
      phone: courier.phone || "",
      email: courier.email || "",
      vehicle: courier.vehicle || "",
    });
    setFieldErrors({});
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (courier) => {
    setPendingId(courier.id);
    setError("");
    setNotice("");
    try {
      const updated = await updateCourier(courier.id, {
        isActive: !courier.isActive,
      });
      setCouriers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(
        `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPendingId(null);
    }
  };

  const deactivate = async (courier) => {
    setPendingId(courier.id);
    setError("");
    setNotice("");
    try {
      const result = await deleteCourier(courier.id);
      // The API either deactivates the record (when assigned) or deletes
      // it, so reload to show the true state.
      setCouriers(await getCouriers());
      setNotice(
        result?.deleted
          ? `${courier.name} was removed.`
          : `${courier.name} was deactivated. Shipment history is kept.`
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Couriers</h1>
          <p className="info-muted">
            Delivery people you can assign to any shipment. Couriers are staff
            records, not login accounts.
          </p>
        </div>
        <Link to="/admin/shipments" className="btn btn-outline">
          <Icon name="parcel" size={16} /> Shipments
        </Link>
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
          <h2>{editingId ? "Edit delivery person" : "Add a delivery person"}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="courier-name">Full name</label>
              <input
                id="courier-name"
                name="name"
                className={`form-input ${
                  fieldErrors.name ? "invalid" : ""
                }`}
                value={values.name}
                onChange={handleChange}
                placeholder="e.g. Diego Alvarez"
                required
              />
              {fieldErrors.name && (
                <p className="field-error" role="alert">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="courier-phone">Phone</label>
              <input
                id="courier-phone"
                name="phone"
                type="tel"
                className="form-input"
                value={values.phone}
                onChange={handleChange}
                placeholder="+1 (212) 555-0175"
              />
            </div>

            <div className="form-group">
              <label htmlFor="courier-email">Email</label>
              <input
                id="courier-email"
                name="email"
                type="email"
                className={`form-input ${
                  fieldErrors.email ? "invalid" : ""
                }`}
                value={values.email}
                onChange={handleChange}
                placeholder="courier@example.com"
              />
              {fieldErrors.email && (
                <p className="field-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="courier-vehicle">Vehicle / badge</label>
              <input
                id="courier-vehicle"
                name="vehicle"
                className="form-input"
                value={values.vehicle}
                onChange={handleChange}
                placeholder="e.g. Cargo van - NYC-14"
              />
            </div>

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
                    : "Add courier"}
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
            <h2>Team ({couriers.length})</h2>
            <span className="admin-count">
              {couriers.filter((courier) => courier.isActive).length} active
            </span>
          </div>

          {loading ? (
            <Spinner label="Loading couriers..." />
          ) : couriers.length === 0 ? (
            <p className="empty-state">
              No delivery people yet. Add the first one with the form.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {couriers.map((courier) => (
                    <tr key={courier.id}>
                      <td data-label="Name">
                        <strong>{courier.name}</strong>
                      </td>
                      <td data-label="Contact">
                        {courier.phone || "—"}
                        {courier.email && (
                          <>
                            <br />
                            <span className="info-muted">{courier.email}</span>
                          </>
                        )}
                      </td>
                      <td data-label="Vehicle">{courier.vehicle || "—"}</td>
                      <td data-label="Status">
                        <span
                          className={`status-pill ${
                            courier.isActive ? "is-active" : "is-inactive"
                          }`}
                        >
                          {courier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td data-label="Actions" className="cell-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => startEdit(courier)}
                          disabled={pendingId === courier.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            courier.isActive
                              ? deactivate(courier)
                              : toggleActive(courier)
                          }
                          disabled={pendingId === courier.id}
                        >
                          {courier.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
