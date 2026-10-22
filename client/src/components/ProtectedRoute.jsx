// -------------------------------------------------------------------
// ProtectedRoute — guards the admin pages.
// -------------------------------------------------------------------
// If the user is not logged in, we redirect to /admin/login. We also
// remember where they wanted to go (state.from) so the login page can
// send them back after a successful login.
// -------------------------------------------------------------------

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
