// -------------------------------------------------------------------
// Admin account + preferences store (demo mode).
// -------------------------------------------------------------------
// In the real backend the password is hashed and never leaves the
// server. Here we keep a small profile in localStorage so the Settings
// page (change password, edit profile, chat/simulation preferences) is
// fully functional without an API.
//
// The default credentials are still admin@example.com / admin123.
// -------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import { createPersistentStore } from "./persistentStore";

export const DEFAULT_CREDENTIALS = {
  email: "admin@example.com",
  password: "admin123",
};

function defaultAccount() {
  return {
    id: 1,
    name: "Admin",
    email: DEFAULT_CREDENTIALS.email,
    phone: "+1 (212) 555-0142",
    role: "admin",
    password: DEFAULT_CREDENTIALS.password,
    joinedAt: "2026-01-12T09:00:00.000Z",
    passwordChangedAt: null,
    prefs: {
      defaultSpeed: 2,
      chatWelcome:
        "Hi! 👋 You are chatting with the SwiftTrack team. Tell us your tracking number and how we can help — a human replies here in a few minutes.",
      supportEmail: "support@swifttrack.com",
      notifyNewMessages: true,
      notifyStatusChanges: true,
    },
  };
}

export const accountStore = createPersistentStore(
  "swifttrack.admin.account.v2",
  defaultAccount
);

export function useAdminAccount() {
  return useSyncExternalStore(
    accountStore.subscribe,
    accountStore.getSnapshot,
    accountStore.getSnapshot
  );
}

export function getAdminAccount() {
  return accountStore.getSnapshot();
}

// Never expose the password to components or localStorage "user".
export function toPublicUser(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    joinedAt: account.joinedAt,
  };
}

export function updateAccount(patch) {
  const current = accountStore.getSnapshot();
  const next = { ...current, ...patch };
  accountStore.set(next);
  return next;
}

export function updatePrefs(patch) {
  const current = accountStore.getSnapshot();
  const next = {
    ...current,
    prefs: { ...current.prefs, ...patch },
  };
  accountStore.set(next);
  return next;
}
