// -------------------------------------------------------------------
// Login — admin sign-in page (/admin/login).
// -------------------------------------------------------------------
// Mock credentials: admin@example.com / admin123
// -------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/admin.css";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Where to go after login: the page they tried to visit, or /admin.
  const from = location.state?.from?.pathname || "/admin";

  // If already logged in, don't show the login form.
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!password) next.password = "Password is required.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setApiError("");

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="form card login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <h1>Admin sign in</h1>
          <p className="info-muted">SwiftTrack staff area</p>
        </div>

        {apiError && (
          <div className="alert alert-error" role="alert">
            {apiError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className={`form-input ${errors.email ? "invalid" : ""}`}
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="field-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={`form-input ${errors.password ? "invalid" : ""}`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <p className="field-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="login-hint">
          Demo credentials: <code>admin@example.com</code> /{" "}
          <code>admin123</code>. Change them in the admin Settings page.
        </p>

        <Link to="/" className="login-back">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
