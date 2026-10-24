// -------------------------------------------------------------------
// ChatWidget — the customer ⇄ admin live chat bubble.
// -------------------------------------------------------------------
// Appears on every public page. Messages are stored in the shared chat
// store, so the admin sees them instantly in /admin/messages (and in
// another browser tab thanks to the storage sync).
// -------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  conversationForVisitor,
  markReadByCustomer,
  refreshVisitorConversation,
  sendCustomerMessage,
  unreadForCustomer,
  useChatStore,
  useVisitor,
  saveVisitor,
} from "../lib/chat";
import { USE_MOCK } from "../api/client";
import { useBrand } from "../context/SettingsContext";
import { formatChatTime } from "../utils/format";
import Icon from "./Icon";
import "../styles/chat.css";

const SUGGESTIONS = [
  "Where is my parcel?",
  "Change my delivery address",
  "Report a delay",
];

export default function ChatWidget() {
  const chatState = useChatStore();
  const visitor = useVisitor();
  const brand = useBrand();
  const prefs = { chatWelcome: brand.chatWelcome };

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingIdentity, setEditingIdentity] = useState(!visitor.name);
  const [name, setName] = useState(visitor.name || "");
  const [email, setEmail] = useState(visitor.email || "");
  const [identityError, setIdentityError] = useState("");

  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const conversation = conversationForVisitor(chatState, visitor.id);
  const messages = conversation?.messages || [];
  const unread = unreadForCustomer(chatState, visitor.id);
  const hasIdentity = Boolean(visitor.name.trim());

  // Opening the panel marks the admin's replies as read for this visitor.
  useEffect(() => {
    if (open && hasIdentity) {
      markReadByCustomer(visitor.id);
    }
  }, [open, hasIdentity, messages.length, visitor.id]);

  // Real mode: poll the server every few seconds so admin replies show
  // up (and the unread badge stays honest), even when the panel is shut.
  useEffect(() => {
    if (USE_MOCK || !hasIdentity) return undefined;
    refreshVisitorConversation(visitor.id);
    const timer = setInterval(
      () => refreshVisitorConversation(visitor.id),
      4000
    );
    return () => clearInterval(timer);
  }, [visitor.id, hasIdentity]);

  // Keep the latest message visible.
  useEffect(() => {
    if (!open) return;
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [open, messages.length, editingIdentity]);

  // Focus the composer when the panel opens.
  useEffect(() => {
    if (open && hasIdentity && !editingIdentity) {
      const timer = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, hasIdentity, editingIdentity]);

  const handleIdentity = (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setIdentityError("Please tell us your name so we can help you.");
      return;
    }
    setIdentityError("");
    saveVisitor({ name: name.trim(), email: email.trim() });
    setEditingIdentity(false);
  };

  const handleSend = (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (!hasIdentity) {
      setEditingIdentity(true);
      return;
    }
    sendCustomerMessage(visitor, text);
    setDraft("");
  };

  const pickSuggestion = (text) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        className={`chat-launcher ${open ? "is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="swifttrack-chat-panel"
      >
        <Icon name={open ? "close" : "chat"} size={20} />
        {!open && <span className="chat-launcher-text">Chat with us</span>}
        {!open && unread > 0 && (
          <span className="chat-launcher-badge">{unread}</span>
        )}
      </button>

      {open && (
        <section
          id="swifttrack-chat-panel"
          className="chat-panel"
          role="dialog"
          aria-label="Chat with SwiftTrack support"
        >
          <header className="chat-header">
            <div className="chat-avatar" aria-hidden="true">
              ST
            </div>
            <div className="chat-header-text">
              <strong>SwiftTrack Support</strong>
              <span>
                <span className="live-dot" /> Online · replies in a few minutes
              </span>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="chat-body" ref={bodyRef}>
            <div className="chat-day">Today</div>

            <div className="chat-bubble admin chat-bubble-welcome">
              {prefs.chatWelcome ||
                "Hi! Tell us your tracking number and how we can help."}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-bubble ${
                  message.from === "customer" ? "customer" : "admin"
                }`}
              >
                {message.text}
                <span className="chat-time">{formatChatTime(message.at)}</span>
              </div>
            ))}

            {editingIdentity && (
              <form className="chat-identity" onSubmit={handleIdentity}>
                <p className="chat-identity-title">
                  {hasIdentity ? "Update your details" : "Before we start"}
                </p>
                <div className="form-group">
                  <label htmlFor="chat-name">Your name</label>
                  <input
                    id="chat-name"
                    className="form-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Marie N."
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="chat-email">Email (optional)</label>
                  <input
                    id="chat-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {identityError && (
                  <p className="field-error" role="alert">
                    {identityError}
                  </p>
                )}
                <button type="submit" className="btn btn-primary btn-sm">
                  Save and continue
                </button>
              </form>
            )}

            {!editingIdentity && messages.length === 0 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => pickSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chat-identity-row">
            {hasIdentity ? (
              <>
                <span>
                  Chatting as <strong>{visitor.name}</strong>
                </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setEditingIdentity((value) => !value)}
                >
                  {editingIdentity ? "Cancel" : "Change"}
                </button>
              </>
            ) : (
              <span>Tell us who you are to start a conversation.</span>
            )}
          </div>

          <form className="chat-composer" onSubmit={handleSend}>
            <label htmlFor="chat-message" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-message"
              ref={inputRef}
              className="chat-input"
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(event);
                }
              }}
              placeholder="Write a message…"
              disabled={editingIdentity || !hasIdentity}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!draft.trim() || editingIdentity || !hasIdentity}
              aria-label="Send message"
            >
              <Icon name="arrowRight" size={18} />
            </button>
          </form>

          <p className="chat-foot">
            <Icon name="shield" size={12} /> Private conversation · SwiftTrack
            support team
          </p>
        </section>
      )}
    </>
  );
}
