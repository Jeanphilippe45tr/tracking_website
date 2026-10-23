// -------------------------------------------------------------------
// AuthContext — global login state shared by every component.
// -------------------------------------------------------------------
// It keeps the admin token (the ONLY thing we store in localStorage)
// and the logged-in user. ProtectedRoute reads `isAuthenticated` from
// here to decide whether to show a page or redirect to /admin/login.
// -------------------------------------------------------------------

import { createContext, useContext, useState, useCallback } from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read the token once on startup so a page refresh keeps you logged in.
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    // The lightweight user object is kept in memory only, but we can
    // rebuild it from localStorage if needed. Here we simply try to
    // restore the email we stored alongside the token.
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // Log in: call the API, then save token + user.
  const login = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await authApi.login(
      email,
      password
    );
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  // Log out: clear everything.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Called after the admin edits their profile in Settings so the name
  // in the navbar / dashboard updates immediately.
  const updateUser = useCallback((nextUser) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook so components do: const { login } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
