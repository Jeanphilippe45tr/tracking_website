// -------------------------------------------------------------------
// Axios instance used for every real backend call.
// -------------------------------------------------------------------
// ALL HTTP calls in the app go through this file (and the files next to
// it: shipments.js, auth.js). Components never call axios directly, so
// switching to the real backend only means editing the api/ folder.
//
// The base URL and the mock switch come from client/.env:
//   VITE_USE_MOCK=true   -> fake data (no server needed)
//   VITE_API_URL=...     -> where the real backend lives
// -------------------------------------------------------------------

import axios from "axios";

// Vite exposes env variables that start with VITE_ on import.meta.env.
// We compare to the string "true" because env values are always strings.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// The shared axios instance. Every request made with it will use API_URL
// as a prefix, so shipments.js can call "/shipments" instead of the full
// URL.
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Request interceptor -------------------------------------------
// Runs before every request. It attaches the admin token (if we have
// one) so protected endpoints get: Authorization: Bearer <token>
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor ------------------------------------------
// Runs when a response comes back. We normalise errors to a simple
// Error object whose .message matches the backend contract
// ({ "error": "message" }) so components can show it directly.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response) {
      // The server answered with an error status (400, 401, 404, ...).
      message = error.response.data?.error || message;
      error.status = error.response.status;
    } else if (error.request) {
      // The request was sent but no answer came back (server offline).
      message = "Cannot reach the server. Is the backend running?";
    }

    error.message = message;
    return Promise.reject(error);
  }
);

// Small helper reused by the mock functions to fake network latency.
// 500 ms feels like a real API call without being annoying.
export const delay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default apiClient;
