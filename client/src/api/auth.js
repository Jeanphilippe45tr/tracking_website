// -------------------------------------------------------------------
// Authentication API functions.
// -------------------------------------------------------------------
// Same mock/real switch pattern as shipments.js.
// Mock credentials: admin@example.com / admin123
// -------------------------------------------------------------------

import apiClient, { USE_MOCK, delay } from "./client";
import { mockUser } from "./mockData";

// --- POST /auth/login {email, password} ----------------------------
// Returns { token, user } on success, throws an Error on failure.
export async function login(email, password) {
  if (USE_MOCK) {
    await delay(600);

    const isCorrect =
      email.trim().toLowerCase() === mockUser.email &&
      password === "admin123";

    if (!isCorrect) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // A fake token. The real backend will send a real JWT string here.
    return {
      token: `mock-token-${Date.now()}`,
      user: mockUser,
    };
  }

  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}
