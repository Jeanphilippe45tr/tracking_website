// -------------------------------------------------------------------
// App — routing for the whole site.
// -------------------------------------------------------------------
// Public routes share the Navbar + Footer layout. The admin area has
// its own layout and is wrapped in <ProtectedRoute> (except the login
// page).
// -------------------------------------------------------------------

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Public pages
import Home from "./pages/Home";
import Track from "./pages/Track";
import TrackResult from "./pages/TrackResult";
import RelayPoints from "./pages/RelayPoints";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Admin pages
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ShipmentsList from "./pages/admin/ShipmentsList";
import CreateShipment from "./pages/admin/CreateShipment";
import ShipmentDetail from "./pages/admin/ShipmentDetail";

// A shared layout for the public pages: navbar on top, footer below.
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

// A layout for the admin area: lighter navbar, no marketing footer.
function AdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    // AuthProvider wraps everything so any page can read the login state.
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* ---------------- Public routes ---------------- */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/track"
          element={
            <PublicLayout>
              <Track />
            </PublicLayout>
          }
        />
        <Route
          path="/track/:trackingNumber"
          element={
            <PublicLayout>
              <TrackResult />
            </PublicLayout>
          }
        />
        <Route
          path="/relay-points"
          element={
            <PublicLayout>
              <RelayPoints />
            </PublicLayout>
          }
        />
        <Route
          path="/services"
          element={
            <PublicLayout>
              <Services />
            </PublicLayout>
          }
        />
        <Route
          path="/pricing"
          element={
            <PublicLayout>
              <Pricing />
            </PublicLayout>
          }
        />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />
        <Route
          path="/help"
          element={
            <PublicLayout>
              <Help />
            </PublicLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <PublicLayout>
              <Terms />
            </PublicLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <PublicLayout>
              <Privacy />
            </PublicLayout>
          }
        />

        {/* ---------------- Admin login (public) ---------------- */}
        <Route
          path="/admin/login"
          element={
            <AdminLayout>
              <Login />
            </AdminLayout>
          }
        />

        {/* ---------------- Admin routes (protected) ---------------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipments"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ShipmentsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipments/new"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CreateShipment />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shipments/:trackingNumber"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ShipmentDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* A couple of convenience redirects. */}
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

        {/* ---------------- 404 ---------------- */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
