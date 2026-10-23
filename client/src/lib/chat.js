// -------------------------------------------------------------------
// Chat store — the live customer ⇄ admin messaging inbox.
// -------------------------------------------------------------------
// Supports both mock mode (localStorage) and real mode (API with polling).
// The component interface stays the same regardless of mode.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { USE_MOCK } from "../api/client";
import { createPersistentStore } from "./persistentStore";
import * as chatApi from "../api/chat";

const uid = (prefix = "m") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const isoMinutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

function seedConversations() {
  return [
    {
      id: "conv-demo",
      visitorId: "demo-visitor",
      name: "Emma Reynolds",
      email: "emma.r@example.com",
      subject: "Delivery to London",
      createdAt: isoMinutesAgo(48),
      updatedAt: isoMinutesAgo(9),
      messages: [
        {
          id: "msg-demo-1",
          from: "customer",
          text: "Hello! My parcel TRK3F9A12BC7D is heading to London. Can I collect it at the relay point instead?",
          at: isoMinutesAgo(48),
          readByAdmin: true,
          readByCustomer: true,
        },
        {
          id: "msg-demo-2",
          from: "admin",
          text: "Hi Emma — yes, absolutely. We can reroute it to Relay Point Canary Wharf free of charge. It should arrive there tomorrow before 18:00.",
          at: isoMinutesAgo(14),
          readByAdmin: true,
          readByCustomer: false,
        },
        {
          id: "msg-demo-3",
          from: "customer",
          text: "Perfect, thank you so much!",
          at: isoMinutesAgo(9),
          readByAdmin: false,
          readByCustomer: true,
        },
      ],
    },
  ];
}

// Create the appropriate store implementation at module level
let chatStoreImpl;
let visitorStoreImpl;

if (USE_MOCK) {
  // Mock mode: localStorage store
  chatStoreImpl = createPersistentStore(
    "swifttrack.chat.v2",
    () => ({ conversations: seedConversations() })
  );

  visitorStoreImpl = createPersistentStore(
    "swifttrack.visitor.v1",
    () => ({ id: uid("visitor"), name: "", email: "" })
  );
} else {
  // Real mode: API-backed store with polling
  let cache = { conversations: [], unreadForAdmin: 0 };
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  chatStoreImpl = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return cache;
    },
    async refresh() {
      try {
        const data = await chatApi.getConversations();
        const conversations = data.conversations || [];
        const unreadForAdmin = data.unreadForAdmin || 0;
        cache = { conversations, unreadForAdmin };
        emit();
      } catch (err) {
        // If unauthorized (401), stop polling - admin not logged in or token expired
        if (err.status === 401) {
          stopPolling();
        }
        console.error("Failed to fetch conversations:", err);
      }
    },
  };

  // Visitor store for real mode
  let visitorCache = { id: uid("visitor"), name: "", email: "" };
  const visitorListeners = new Set();

  function visitorEmit() {
    visitorListeners.forEach((l) => l());
  }

  visitorStoreImpl = {
    subscribe(listener) {
      visitorListeners.add(listener);
      return () => visitorListeners.delete(listener);
    },
    getSnapshot() {
      return visitorCache;
    },
    set(patch) {
      visitorCache = { ...visitorCache, ...patch };
      visitorEmit();
    },
  };

  // Polling control - only poll when admin is authenticated
  let pollInterval = null;
  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(() => chatStoreImpl.refresh(), 3000);
    chatStoreImpl.refresh(); // initial fetch
  }
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }
  // Check for admin token and start/stop polling accordingly
  function checkAuthAndPoll() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      startPolling();
    } else {
      stopPolling();
    }
  }
  // Initial check
  checkAuthAndPoll();
  // Listen for storage changes (login/logout in another tab)
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "token") {
        checkAuthAndPoll();
      }
    });
  }
}

// Unified hooks - always call useSyncExternalStore in the same order
export function useChatStore() {
  return useSyncExternalStore(
    chatStoreImpl.subscribe,
    chatStoreImpl.getSnapshot,
    chatStoreImpl.getSnapshot
  );
}

export function useVisitor() {
  return useSyncExternalStore(
    visitorStoreImpl.subscribe,
    visitorStoreImpl.getSnapshot,
    visitorStoreImpl.getSnapshot
  );
}

export function saveVisitor(patch) {
  if (USE_MOCK) {
    const current = visitorStoreImpl.getSnapshot();
    visitorStoreImpl.set({ ...current, ...patch });
  } else {
    visitorStoreImpl.set(patch);
  }
}

export function conversationForVisitor(state, visitorId) {
  return state.conversations.find((c) => c.visitorId === visitorId) || null;
}

export function sortConversations(conversations) {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

export function unreadForAdmin(state) {
  // In API mode, unreadForAdmin is provided by the server
  if (!USE_MOCK && state.unreadForAdmin !== undefined) {
    return state.unreadForAdmin;
  }
  return state.conversations.reduce(
    (total, conversation) =>
      total +
      conversation.messages.filter(
        (message) => message.from === "customer" && !message.readByAdmin
      ).length,
    0
  );
}

export function unreadInConversation(conversation) {
  if (!conversation) return 0;
  return conversation.messages.filter(
    (message) => message.from === "customer" && !message.readByAdmin
  ).length;
}

export function unreadForCustomer(state, visitorId) {
  const conversation = conversationForVisitor(state, visitorId);
  if (!conversation) return 0;
  return conversation.messages.filter(
    (message) => message.from === "admin" && !message.readByCustomer
  ).length;
}

export function lastMessage(conversation) {
  if (!conversation || conversation.messages.length === 0) return null;
  return conversation.messages[conversation.messages.length - 1];
}

export function sendCustomerMessage(visitor, text) {
  const body = String(text || "").trim();
  if (!body) return;

  if (USE_MOCK) {
    const now = new Date().toISOString();
    const message = {
      id: uid(),
      from: "customer",
      text: body,
      at: now,
      readByAdmin: false,
      readByCustomer: true,
    };

    chatStoreImpl.set((state) => {
      const existing = conversationForVisitor(state, visitor.id);

      if (existing) {
        return {
          ...state,
          conversations: state.conversations.map((conversation) =>
            conversation.id === existing.id
              ? {
                  ...conversation,
                  name: visitor.name?.trim() || conversation.name,
                  email: visitor.email?.trim() || conversation.email,
                  updatedAt: now,
                  messages: [...conversation.messages, message],
                }
              : conversation
          ),
        };
      }

      const conversation = {
        id: uid("conv"),
        visitorId: visitor.id,
        name: visitor.name?.trim() || "Website visitor",
        email: visitor.email?.trim() || "",
        subject: "Website chat",
        createdAt: now,
        updatedAt: now,
        messages: [message],
      };

      return {
        ...state,
        conversations: [conversation, ...state.conversations],
      };
    });
  } else {
    chatApi
      .createConversation({
        visitorId: visitor.id,
        name: visitor.name,
        email: visitor.email,
        text: body,
      })
      .then(() => chatStoreImpl.refresh());
  }
}

export function sendAdminMessage(conversationId, text) {
  const body = String(text || "").trim();
  if (!body) return;

  if (USE_MOCK) {
    const now = new Date().toISOString();
    const message = {
      id: uid(),
      from: "admin",
      text: body,
      at: now,
      readByAdmin: true,
      readByCustomer: false,
    };

    chatStoreImpl.set((state) => ({
      ...state,
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              updatedAt: now,
              messages: [...conversation.messages, message],
            }
          : conversation
      ),
    }));
  } else {
    chatApi
      .sendAdminMessage(conversationId, body)
      .then(() => chatStoreImpl.refresh());
  }
}

export function markReadByAdmin(conversationId) {
  if (USE_MOCK) {
    chatStoreImpl.set((state) => {
      let changed = false;

      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        const messages = conversation.messages.map((message) => {
          if (message.from === "customer" && !message.readByAdmin) {
            changed = true;
            return { ...message, readByAdmin: true };
          }
          return message;
        });

        return changed ? { ...conversation, messages } : conversation;
      });

      return changed ? { ...state, conversations } : state;
    });
  } else {
    chatApi
      .markReadByAdmin(conversationId)
      .then(() => chatStoreImpl.refresh());
  }
}

export function markAllReadByAdmin() {
  if (USE_MOCK) {
    chatStoreImpl.set((state) => {
      let changed = false;
      const conversations = state.conversations.map((conversation) => {
        let conversationChanged = false;
        const messages = conversation.messages.map((message) => {
          if (message.from === "customer" && !message.readByAdmin) {
            changed = true;
            conversationChanged = true;
            return { ...message, readByAdmin: true };
          }
          return message;
        });
        return conversationChanged ? { ...conversation, messages } : conversation;
      });
      return changed ? { ...state, conversations } : state;
    });
  } else {
    chatApi.markAllReadByAdmin().then(() => chatStoreImpl.refresh());
  }
}

export function markReadByCustomer(visitorId) {
  if (USE_MOCK) {
    chatStoreImpl.set((state) => {
      let changed = false;

      const conversations = state.conversations.map((conversation) => {
        if (conversation.visitorId !== visitorId) return conversation;

        const messages = conversation.messages.map((message) => {
          if (message.from === "admin" && !message.readByCustomer) {
            changed = true;
            return { ...message, readByCustomer: true };
          }
          return message;
        });

        return changed ? { ...conversation, messages } : conversation;
      });

      return changed ? { ...state, conversations } : state;
    });
  } else {
    chatApi.markReadByCustomer(visitorId).then(() => chatStoreImpl.refresh());
  }
}

export function deleteConversation(conversationId) {
  if (USE_MOCK) {
    chatStoreImpl.set((state) => ({
      ...state,
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    }));
  } else {
    chatApi.deleteConversation(conversationId).then(() => chatStoreImpl.refresh());
  }
}

export function clearAllConversations() {
  if (USE_MOCK) {
    chatStoreImpl.set((state) => ({ ...state, conversations: [] }));
  } else {
    chatApi.clearAllConversations().then(() => chatStoreImpl.refresh());
  }
}

export { uid };