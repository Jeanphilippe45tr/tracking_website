// -------------------------------------------------------------------
// Contact inbox / newsletter / "notify me" API functions.
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";

// --- GET /api/contact (ADMIN) — contact inbox, newest first ----------
export async function getContactMessages() {
  if (USE_MOCK) {
    await delay(300);
    // Mock mode has no stored submissions.
    return [];
  }

  const { data } = await apiClient.get("/contact");
  return data;
}

// --- PATCH /api/contact/:id/read (ADMIN) ------------------------------
export async function markContactMessageRead(id) {
  if (USE_MOCK) {
    await delay(200);
    return { ok: true };
  }

  const { data } = await apiClient.patch(`/contact/${id}/read`);
  return data;
}

// --- DELETE /api/contact/:id (ADMIN) ----------------------------------
export async function deleteContactMessage(id) {
  if (USE_MOCK) {
    await delay(200);
    return { ok: true };
  }

  const { data } = await apiClient.delete(`/contact/${id}`);
  return data;
}

// --- POST /api/notifications/subscribe --------------------------------
export async function subscribeToUpdates({ trackingNumber, email }) {
  if (USE_MOCK) {
    await delay(400);
    if (!email || !/.+@.+\..+/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    return { ok: true, message: "You will receive email updates about this parcel." };
  }

  const { data } = await apiClient.post("/notifications/subscribe", {
    trackingNumber,
    email,
  });
  return data;
}

// --- POST /api/newsletter (footer) ------------------------------------
export async function subscribeToNewsletter(email) {
  if (USE_MOCK) {
    await delay(400);
    if (!email || !/.+@.+\..+/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    return { ok: true, message: "Subscribed! Welcome aboard." };
  }

  const { data } = await apiClient.post("/notifications/newsletter", { email });
  return data;
}
