// -------------------------------------------------------------------
// Chat API functions.
// -------------------------------------------------------------------
// Real API calls for the chat system. In mock mode, the client uses
// localStorage (lib/chat.js).
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";

// --- POST /api/chat/conversations {visitorId, name?, email?, text} ---
export async function createConversation(payload) {
  if (USE_MOCK) {
    await delay(400);
    // Mock mode is handled by lib/chat.js store directly
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post("/chat/conversations", payload);
  return data;
}

// --- GET /api/chat/conversations ---
export async function getConversations() {
  if (USE_MOCK) {
    await delay(400);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.get("/chat/conversations");
  return data;
}

// --- GET /api/chat/conversations/:id ---
export async function getConversation(id) {
  if (USE_MOCK) {
    await delay(400);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.get(`/chat/conversations/${id}`);
  return data;
}

// --- POST /api/chat/conversations/:id/messages {text} ---
export async function sendAdminMessage(conversationId, text) {
  if (USE_MOCK) {
    await delay(400);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.post(
    `/chat/conversations/${conversationId}/messages`,
    { text }
  );
  return data;
}

// --- PATCH /api/chat/conversations/:id/read ---
export async function markReadByAdmin(conversationId) {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.patch(
    `/chat/conversations/${conversationId}/read`
  );
  return data;
}

// --- PATCH /api/chat/conversations/read-all ---
export async function markAllReadByAdmin() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.patch("/chat/conversations/read-all");
  return data;
}

// --- PATCH /api/chat/conversations/visitor/read {visitorId} ---
export async function markReadByCustomer(visitorId) {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.patch("/chat/conversations/visitor/read", {
    visitorId,
  });
  return data;
}

// --- DELETE /api/chat/conversations/:id ---
export async function deleteConversation(conversationId) {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.delete(
    `/chat/conversations/${conversationId}`
  );
  return data;
}

// --- DELETE /api/chat/conversations ---
export async function clearAllConversations() {
  if (USE_MOCK) {
    await delay(300);
    throw new Error("Not implemented in mock mode");
  }

  const { data } = await apiClient.delete("/chat/conversations");
  return data;
}