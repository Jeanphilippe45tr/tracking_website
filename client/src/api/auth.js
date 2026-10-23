// -------------------------------------------------------------------
// Authentication API functions.
// -------------------------------------------------------------------
// Same mock/real switch pattern as shipments.js.
//
// In mock mode the admin profile lives in localStorage (see
// lib/adminAccount.js) so the Settings page can change the login email
// and password. Default credentials: admin@example.com / admin123
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";
import {
  getAdminAccount,
  toPublicUser,
  updateAccount,
  updatePrefs,
} from "../lib/adminAccount";

// --- POST /auth/login {email, password} ----------------------------
// Returns { token, user } on success, throws an Error on failure.
export async function login(email, password) {
  if (USE_MOCK) {
    await delay(600);

    const account = getAdminAccount();
    const isCorrect =
      email.trim().toLowerCase() === account.email.trim().toLowerCase() &&
      password === account.password;

    if (!isCorrect) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // A fake token. The real backend will send a real JWT string here.
    return {
      token: `mock-token-${Date.now()}`,
      user: toPublicUser(account),
    };
  }

  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

// --- PATCH /auth/me ------------------------------------------------
// Updates the profile (name, email, phone). Returns the public user.
export async function updateProfile(patch) {
  if (USE_MOCK) {
    await delay(400);
    const account = updateAccount({
      name: patch.name?.trim(),
      email: patch.email?.trim().toLowerCase(),
      phone: patch.phone?.trim() ?? "",
    });
    return toPublicUser(account);
  }

  const { data } = await apiClient.patch("/auth/me", patch);
  return data;
}

// --- POST /auth/change-password ------------------------------------
export async function changePassword(currentPassword, newPassword) {
  if (USE_MOCK) {
    await delay(500);
    const account = getAdminAccount();

    if (currentPassword !== account.password) {
      const err = new Error("Your current password is incorrect.");
      err.status = 400;
      throw err;
    }

    updateAccount({
      password: newPassword,
      passwordChangedAt: new Date().toISOString(),
    });
    return { ok: true };
  }

  const { data } = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}

// --- PATCH /auth/preferences --------------------------------------
// Chat + simulation preferences. Mock mode stores them locally.
export async function updatePreferences(patch) {
  if (USE_MOCK) {
    await delay(300);
    const account = updatePrefs(patch);
    return account.prefs;
  }

  const { data } = await apiClient.patch("/auth/preferences", patch);
  return data;
}
