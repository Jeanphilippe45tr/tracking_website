// -------------------------------------------------------------------
// Admin Dashboard (/admin) — stat cards + recent shipments table.
// -------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getShipments, STATUSES } from "../../api/shipments";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import { formatDate } from "../../utils/format";
import "../../styles/admin.css";

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search + filter for the recent table.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let active = true; // avoid setting state after unmount
    (async () => {
      try {
        const data = await getShipments();
        if (active) setShipments(data);
      } catch (err) {
        if (active) setError(err.message || "Could not load shipments.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Count shipments per bucket. useMemo avoids recomputing on every
  // keystroke in the search box.
  const stats = useMemo(() => {
    return {
      total: shipments.length,
      inTransit: shipments.filter((s) => s.status === "In transit").length,
      delivered: shipments.filter((s) => s.status === "Delivered").length,
      delayed: shipments.filter((s) => s.status === "Delayed").length,
    };
  }, [shipments]);

  // Apply search + status filter to the table.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesStatus =
        statusFilter === "All" || s.status === statusFilter;
      const matchesSearch =
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [shipments, search, statusFilter]);

  // Only show the 6 most recent in the dashboard preview.
  const recent = filtered.slice(0, 6);

  if (loading) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p className="info-muted">Overview of all shipments</p>
        </div>
        <Link to="/admin/shipments/new" className="btn btn-primary">
          + New shipment
        </Link>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* ---------------- Stat cards ---------------- */}
      <div className="stats-grid">
        <div className="stat-card card stat-total">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total shipments</span>
        </div>
        <div className="stat-card card stat-transit">
          <span className="stat-value">{stats.inTransit}</span>
          <span className="stat-label">In transit</span>
        </div>
        <div className="stat-card card stat-delivered">
          <span className="stat-value">{stats.delivered}</span>
          <span className="stat-label">Delivered</span>
        </div>
        <div className="stat-card card stat-delayed">
          <span className="stat-value">{stats.delayed}</span>
          <span className="stat-label">Delayed</span>
        </div>
      </div>

      {/* ---------------- Recent shipments ---------------- */}
      <section className="admin-section card">
        <div className="admin-section-head">
          <h2>Recent shipments</h2>
          <Link to="/admin/shipments" className="link-btn">
            View all →
          </Link>
        </div>

        <div className="table-toolbar">
          <div className="form-group">
            <label htmlFor="dash-search" className="sr-only">
              Search shipments
            </label>
            <input
              id="dash-search"
              type="search"
              className="form-input"
              placeholder="Search tracking number, receiver, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dash-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="dash-status"
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="empty-state">No shipments match your search.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Receiver</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Tracking">
                      <code>{s.trackingNumber}</code>
                    </td>
                    <td data-label="Receiver">{s.receiverName}</td>
                    <td data-label="Destination">{s.destination}</td>
                    <td data-label="Status">
                      <StatusBadge status={s.status} />
                    </td>
                    <td data-label="Created">{formatDate(s.createdAt)}</td>
                    <td data-label="Actions" className="cell-actions">
                      <Link
                        to={`/admin/shipments/${s.trackingNumber}`}
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
