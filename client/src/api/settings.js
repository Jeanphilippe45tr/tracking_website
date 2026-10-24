// -------------------------------------------------------------------
// Site settings API — brand/contact details managed by the admin.
// -------------------------------------------------------------------
// GET  /settings          (public)  — used by the SettingsProvider
// PATCH /settings         (admin)   — used by the admin Settings page
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";
import { BRAND } from "../data/site";
import { getAdminAccount, updatePrefs } from "../lib/adminAccount";

// Default = the built-in brand values so the site renders instantly
// even before GET /settings answers.
export const DEFAULT_SETTINGS = {
  brandName: BRAND.name,
  supportEmail: BRAND.email,
  supportPhone: BRAND.phone,
  whatsappNumber: BRAND.whatsapp?.replace(/^\+/, "") || "12125550142",
  chatWelcome:
    "Hi! You are chatting with the SwiftTrack team. Tell us your tracking number and how we can help — a human replies here in a few minutes.",
};

// --- GET /settings (PUBLIC) -----------------------------------------
export async function getSiteSettings() {
  if (USE_MOCK) {
    await delay(200);
    const account = getAdminAccount();
    return {
      ...DEFAULT_SETTINGS,
      // In mock mode the chat prefs stored in the admin account win,
      // so the Settings page round-trip keeps working offline.
      chatWelcome: account.prefs.chatWelcome || DEFAULT_SETTINGS.chatWelcome,
      supportEmail: account.prefs.supportEmail || DEFAULT_SETTINGS.supportEmail,
    };
  }
  const { data } = await apiClient.get("/settings");
  return data;
}

// --- PATCH /settings (ADMIN) -----------------------------------------
export async function updateSiteSettings(patch) {
  if (USE_MOCK) {
    await delay(400);
    if (patch.chatWelcome !== undefined || patch.supportEmail !== undefined) {
      updatePrefs({
        ...(patch.chatWelcome !== undefined
          ? { chatWelcome: patch.chatWelcome }
          : {}),
        ...(patch.supportEmail !== undefined
          ? { supportEmail: patch.supportEmail }
          : {}),
      });
    }
    const account = getAdminAccount();
    return {
      ...DEFAULT_SETTINGS,
      chatWelcome: account.prefs.chatWelcome,
      supportEmail: account.prefs.supportEmail,
      ...patch,
    };
  }
  const { data } = await apiClient.patch("/settings", patch);
  return data;
}
