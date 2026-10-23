// -------------------------------------------------------------------
// Chat store — the live customer ⇄ admin messaging inbox.
// -------------------------------------------------------------------
// Demo implementation (no backend): conversations are kept in
// localStorage and synchronised between tabs, so the customer widget
// and the admin inbox feel live. A real deployment would replace the
// functions below with API calls (GET /conversations, POST /messages…)
// while keeping the same component contracts.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { createPersistentStore } from "./persistentStore";

const uid = (prefix = "m") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const isoMinutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

// One example conversation so the admin inbox is useful immediately.
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

export const chatStore = createPersistentStore(
  "swifttrack.chat.v2",
  () => ({ conversations: seedConversations() })
);

export const visitorStore = createPersistentStore(
  "swifttrack.visitor.v1",
  () => ({ id: uid("visitor"), name: "", email: "" })
);

export function useChatStore() {
  return useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getSnapshot
  );
}

export function useVisitor() {
  return useSyncExternalStore(
    visitorStore.subscribe,
    visitorStore.getSnapshot,
    visitorStore.getSnapshot
  );
}

export function saveVisitor(patch) {
  const current = visitorStore.getSnapshot();
  visitorStore.set({ ...current, ...patch });
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

  const now = new Date().toISOString();
  const message = {
    id: uid(),
    from: "customer",
    text: body,
    at: now,
    readByAdmin: false,
    readByCustomer: true,
  };

  chatStore.set((state) => {
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
}

export function sendAdminMessage(conversationId, text) {
  const body = String(text || "").trim();
  if (!body) return;

  const now = new Date().toISOString();
  const message = {
    id: uid(),
    from: "admin",
    text: body,
    at: now,
    readByAdmin: true,
    readByCustomer: false,
  };

  chatStore.set((state) => ({
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
}

// Mark every customer message as seen by the admin. Returns without
// touching the store when nothing changed, which prevents render loops
// when this is called from an effect.
export function markReadByAdmin(conversationId) {
  chatStore.set((state) => {
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
}

export function markAllReadByAdmin() {
  chatStore.set((state) => {
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
}

export function markReadByCustomer(visitorId) {
  chatStore.set((state) => {
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
}

export function deleteConversation(conversationId) {
  chatStore.set((state) => ({
    ...state,
    conversations: state.conversations.filter((c) => c.id !== conversationId),
  }));
}

export function clearAllConversations() {
  chatStore.set((state) => ({ ...state, conversations: [] }));
}
