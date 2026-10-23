// -------------------------------------------------------------------
// Admin Dashboard (/admin) — stat cards + recent shipments table.
// -------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getShipments, STATUSES } from "../../api/shipments";
import StatusBadge from "../../components/StatusBadge";
import Spinner from "../../components/Spinner";
import SimulationPanel from "../../components/SimulationPanel";
import Icon from "../../components/Icon";
import { formatDate, formatChatTime } from "../../utils/format";
import {
  lastMessage,
  sortConversations,
  unreadForAdmin,
  useChatStore,
} from "../../lib/chat";
import "../../styles/admin.css";

// Two-letter avatar for the message previews.
function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search + filter for the recent table.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Shared chat inbox (updates live when a visitor writes).
  const chatState = useChatStore();
  const unreadMessages = unreadForAdmin(chatState);
  const recentConversations = useMemo(
    () => sortConversations(chatState.conversations).slice(0, 3),
    [chatState.conversations]
  );

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

      {/* ---------------- Live simulation + inbox ---------------- */}
      <div className="dashboard-tools">
        <SimulationPanel shipments={shipments} />

        <div className="dashboard-side">
          <section className="card dash-messages">
            <div className="dash-msg-head">
              <h2>
                <Icon name="chat" size={17} /> Messages
                {unreadMessages > 0 && (
                  <span className="dash-msg-count">{unreadMessages}</span>
                )}
              </h2>
              <Link to="/admin/messages" className="link-btn">
                Inbox →
              </Link>
            </div>

            {recentConversations.length === 0 ? (
              <p className="info-muted" style={{ margin: "0.5rem 0 0" }}>
                No conversations yet. Visitors can chat from any public page.
              </p>
            ) : (
              <div className="dash-msg-list">
                {recentConversations.map((conversation) => {
                  const last = lastMessage(conversation);
                  const unread = conversation.messages.filter(
                    (message) =>
                      message.from === "customer" && !message.readByAdmin
                  ).length;
                  return (
                    <Link
                      key={conversation.id}
                      to="/admin/messages"
                      state={{ conversationId: conversation.id }}
                      className={`dash-msg-item ${
                        unread > 0 ? "is-unread" : ""
                      }`}
                    >
                      <span className="dash-msg-avatar" aria-hidden="true">
                        {initials(conversation.name)}
                      </span>
                      <span className="dash-msg-main">
                        <span className="dash-msg-top">
                          <span className="dash-msg-name">
                            {conversation.name}
                          </span>
                          <span className="dash-msg-time">
                            {last ? formatChatTime(last.at) : ""}
                          </span>
                        </span>
                        <span className="dash-msg-preview">
                          {last ? last.text : "No messages yet"}
                        </span>
                      </span>
                      {unread > 0 && (
                        <span className="dash-msg-count">{unread}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            <Link to="/admin/messages" className="dash-msg-all">
              Open the full inbox <Icon name="arrowRight" size={14} />
            </Link>
          </section>

          <section className="card">
            <h2>
              <Icon name="bolt" size={17} /> Quick actions
            </h2>
            <div className="quick-actions">
              <Link to="/admin/shipments/new" className="quick-action">
                <Icon name="plus" size={16} /> New shipment
              </Link>
              <Link to="/admin/shipments" className="quick-action">
                <Icon name="parcel" size={16} /> All shipments
              </Link>
              <Link to="/admin/messages" className="quick-action">
                <Icon name="chat" size={16} /> Message inbox
              </Link>
              <Link to="/admin/settings" className="quick-action">
                <Icon name="shield" size={16} /> Settings
              </Link>
            </div>
          </section>
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
