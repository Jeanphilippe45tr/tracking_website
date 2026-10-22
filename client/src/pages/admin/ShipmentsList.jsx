// -------------------------------------------------------------------
// ShipmentsList (/admin/shipments)
// Full table with search, status filter and front-end pagination.
// -------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getShipments, STATUSES } from "../../api/shipments";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import { formatDate } from "../../utils/format";
import "../../styles/admin.css";

// How many rows to show per page.
const PAGE_SIZE = 5;

export default function ShipmentsList() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
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

  // Filtered list (search + status).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      const matchesSearch =
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [shipments, search, statusFilter]);

  // Reset to page 1 whenever the filters change. We compare against the
  // previous filter values during render (the React-recommended pattern)
  // instead of using an effect, which avoids a wasted extra render.
  const [lastFilters, setLastFilters] = useState({ search, statusFilter });
  if (lastFilters.search !== search || lastFilters.statusFilter !== statusFilter) {
    setLastFilters({ search, statusFilter });
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Slice the filtered list for the current page.
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (loading) return <Spinner label="Loading shipments..." />;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Shipments</h1>
          <p className="info-muted">{filtered.length} shipment(s) found</p>
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

      <section className="admin-section card">
        <div className="table-toolbar">
          <div className="form-group">
            <label htmlFor="list-search" className="sr-only">
              Search shipments
            </label>
            <input
              id="list-search"
              type="search"
              className="form-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="list-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="list-status"
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

        {pageItems.length === 0 ? (
          <p className="empty-state">No shipments match your filters.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Receiver</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Tracking">
                      <code>{s.trackingNumber}</code>
                    </td>
                    <td data-label="Receiver">{s.receiverName}</td>
                    <td data-label="Destination">{s.destination}</td>
                    <td data-label="Status">
                      <StatusBadge status={s.status} />
                    </td>
                    <td data-label="Date">{formatDate(s.createdAt)}</td>
                    <td data-label="Actions" className="cell-actions">
                      <Link
                        to={`/admin/shipments/${s.trackingNumber}`}
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </Link>
                      {/* "Update status" goes to the detail page, where the
                          add-update form lives. */}
                      <Link
                        to={`/admin/shipments/${s.trackingNumber}#add-update`}
                        className="btn btn-secondary btn-sm"
                      >
                        Update status
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- Pagination ---------------- */}
        {filtered.length > PAGE_SIZE && (
          <nav className="pagination" aria-label="Pagination">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
