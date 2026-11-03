// -------------------------------------------------------------------
// ContactInbox — submissions from the public contact form.
// -------------------------------------------------------------------
// The Contact page promises a "24 business hour" reply; this inbox is
// where those messages are read, so nothing vanishes.
// -------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import {
  getContactMessages,
  markContactMessageRead,
  deleteContactMessage,
} from "../../api/contactApi";
import { formatChatTime } from "../../utils/format";
import Icon from "../../components/Icon";

export default function ContactInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const msgs = await getContactMessages();
      setMessages(msgs || []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the contact messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The load call sets state from an async fetch — the normal
    // "load data on mount" pattern the codebase uses elsewhere.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // Light polling so new submissions show up without a manual refresh.
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = async (id) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m))
    );
    try {
      await markContactMessageRead(id);
    } catch {
      load();
    }
  };

  const remove = async (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteContactMessage(id);
    } catch {
      load();
    }
  };

  const visible =
    filter === "unread" ? messages.filter((m) => !m.read) : messages;
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="admin-page">
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <header className="admin-header">
        <div>
          <Icon name="mail" size={18} />
          <h1>Contact inbox</h1>
        </div>
        <p className="info-muted">
          Form submissions from customers — reply by email or phone.
        </p>
      </header>

      <div className="admin-actions" style={{ marginBottom: "var(--space-3)" }}>
        <button
          type="button"
          className={filter === "all" ? "btn btn-sm btn-outline" : "btn btn-sm"}
          onClick={() => setFilter("all")}
        >
          All ({messages.length})
        </button>
        <button
          type="button"
          className={filter === "unread" ? "btn btn-sm btn-outline" : "btn btn-sm"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading && messages.length === 0 ? (
        <div className="card admin-section">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="card admin-section">
          <p className="empty-state">
            {filter === "unread"
              ? "No unread messages — the inbox is quiet."
              : "No contact messages yet."}
          </p>
        </div>
      ) : (
        <ul className="contact-list">
          {visible.map((m) => {
            const isOpen = openId === m.id;
            return (
              <li
                key={m.id}
                className={`card contact-item ${m.read ? "" : "contact-unread"}`}
              >
                <button
                  type="button"
                  className="contact-summary"
                  onClick={() => {
                    setOpenId(isOpen ? null : m.id);
                    if (!m.read) markRead(m.id);
                  }}
                >
                  <span className="contact-name">
                    <strong>{m.name}</strong>
                    <span className="info-muted">{m.email}</span>
                  </span>
                  <span className="contact-tags">
                    <span className="contact-chip">
                      {m.subjectLabel || m.subject}
                    </span>
                    {m.trackingNumber && (
                      <span className="detail-tracking contact-tracking">
                        {m.trackingNumber}
                      </span>
                    )}
                    {!m.read && <span className="contact-chip contact-chip-alert">new</span>}
                  </span>
                  <span className="info-muted">{formatChatTime(m.createdAt)}</span>
                </button>
                {isOpen && (
                  <div className="contact-body">
                    <p>{m.message}</p>
                    <div className="contact-actions">
                      <a className="btn btn-sm btn-outline" href={`mailto:${m.email}`}>
                        Reply by email
                      </a>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => remove(m.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
