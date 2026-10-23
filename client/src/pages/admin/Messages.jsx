// -------------------------------------------------------------------
// Messages — admin inbox for the live customer chat (/admin/messages).
// -------------------------------------------------------------------
// Left: conversation list with unread badges.
// Right: full thread + reply composer.
// New customer messages appear automatically (shared store + storage
// event), so the inbox works while the customer widget is open in
// another tab.
// -------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  deleteConversation,
  lastMessage,
  markAllReadByAdmin,
  markReadByAdmin,
  sendAdminMessage,
  sortConversations,
  unreadForAdmin,
  unreadInConversation,
  useChatStore,
} from "../../lib/chat";
import Icon from "../../components/Icon";
import { formatChatTime } from "../../utils/format";
import "../../styles/admin.css";
import "../../styles/chat.css";

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default function Messages() {
  const chatState = useChatStore();
  const location = useLocation();

  const conversations = useMemo(
    () => sortConversations(chatState.conversations),
    [chatState.conversations]
  );

  const [selectedId, setSelectedId] = useState(
    location.state?.conversationId || ""
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ||
    conversations[0] ||
    null;

  const unread = unreadForAdmin(chatState);

  const selectedConversationId = selected?.id || "";
  const selectedMessageCount = selected?.messages.length || 0;
  const selectedUpdatedAt = selected?.updatedAt || "";

  const bodyRef = useRef(null);

  // Opening a conversation marks its customer messages as read.
  useEffect(() => {
    if (selectedConversationId) markReadByAdmin(selectedConversationId);
  }, [selectedConversationId, selectedMessageCount]);

  // Keep the latest reply in view.
  useEffect(() => {
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [selectedConversationId, selectedMessageCount, selectedUpdatedAt]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const last = lastMessage(conversation);
      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.email.toLowerCase().includes(query) ||
        (last?.text || "").toLowerCase().includes(query)
      );
    });
  }, [conversations, search]);

  const handleReply = (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || !selected) return;
    sendAdminMessage(selected.id, text);
    setDraft("");
  };

  const handleDelete = () => {
    if (!selected) return;
    const confirmed = window.confirm(
      `Delete the conversation with ${selected.name}? This cannot be undone.`
    );
    if (!confirmed) return;
    deleteConversation(selected.id);
    setSelectedId("");
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Messages</h1>
          <p className="info-muted">
            {unread > 0
              ? `${unread} unread message${unread > 1 ? "s" : ""} · `
              : "All caught up · "}
            {conversations.length} conversation
            {conversations.length === 1 ? "" : "s"} · live with the website
            chat
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={markAllReadByAdmin}
          >
            <Icon name="check" size={16} /> Mark all read
          </button>
        )}
      </header>

      {conversations.length === 0 ? (
        <div className="card live-empty">
          <span className="live-empty-icon">
            <Icon name="chat" size={28} />
          </span>
          <h2>No conversations yet</h2>
          <p>
            When a customer uses the chat bubble on the public site, the
            conversation appears here in real time.
          </p>
        </div>
      ) : (
        <div className="inbox-layout">
          {/* ---------------- Conversation list ---------------- */}
          <section className="card inbox-list">
            <div className="inbox-list-head">
              <h2>Inbox</h2>
              <label htmlFor="inbox-search" className="sr-only">
                Search conversations
              </label>
              <input
                id="inbox-search"
                type="search"
                className="inbox-search"
                placeholder="Search name, email or message…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="inbox-items">
              {filtered.length === 0 && (
                <p className="empty-state">No conversation matches.</p>
              )}

              {filtered.map((conversation) => {
                const last = lastMessage(conversation);
                const conversationUnread = unreadInConversation(conversation);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`inbox-item ${
                      selected?.id === conversation.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <span className="inbox-avatar" aria-hidden="true">
                      {initials(conversation.name)}
                    </span>
                    <span className="inbox-item-main">
                      <span className="inbox-item-top">
                        <span className="inbox-name">{conversation.name}</span>
                        <span className="inbox-time">
                          {last ? formatChatTime(last.at) : ""}
                        </span>
                      </span>
                      <span className="inbox-preview">
                        {last
                          ? `${last.from === "admin" ? "You: " : ""}${last.text}`
                          : "No messages yet"}
                      </span>
                    </span>
                    {conversationUnread > 0 && (
                      <span className="inbox-badge">{conversationUnread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---------------- Thread ---------------- */}
          <section className="card inbox-thread">
            {selected ? (
              <>
                <div className="inbox-thread-head">
                  <div className="inbox-thread-info">
                    <h2>{selected.name}</h2>
                    <p>
                      {selected.email || "No email provided"} ·{" "}
                      {selected.subject || "Website chat"} · updated{" "}
                      {formatChatTime(selected.updatedAt)}
                    </p>
                  </div>
                  <div className="inbox-thread-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="inbox-thread-body" ref={bodyRef}>
                  {selected.messages.length === 0 ? (
                    <p className="empty-state">No messages in this thread.</p>
                  ) : (
                    selected.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`inbox-msg ${message.from}`}
                      >
                        {message.text}
                        <span className="inbox-msg-meta">
                          {message.from === "admin" ? "You" : selected.name} ·{" "}
                          {formatChatTime(message.at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form className="inbox-reply" onSubmit={handleReply}>
                  <label htmlFor="inbox-reply-input" className="sr-only">
                    Reply to {selected.name}
                  </label>
                  <textarea
                    id="inbox-reply-input"
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleReply(event);
                      }
                    }}
                    placeholder={`Reply to ${selected.name}…`}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!draft.trim()}
                  >
                    <Icon name="arrowRight" size={16} /> Send
                  </button>
                </form>
              </>
            ) : (
              <div className="inbox-empty">
                Select a conversation to read and reply.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
