// -------------------------------------------------------------------
// App — routing for the whole site.
// -------------------------------------------------------------------
// Public routes share the Navbar + Footer layout. The admin area has
// its own layout and is wrapped in <ProtectedRoute> (except the login
// page).
// -------------------------------------------------------------------

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LiveTrackingProvider } from "./context/LiveTrackingContext";
import { SettingsProvider } from "./context/SettingsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import AdminNav from "./components/AdminNav";
import ChatWidget from "./components/ChatWidget";
import {
  startAdminChatPolling,
  stopAdminChatPolling,
} from "./lib/chat";

// Public pages
import Home from "./pages/Home";
import Track from "./pages/Track";
import TrackResult from "./pages/TrackResult";
import LiveMap from "./pages/LiveMap";
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
import Messages from "./pages/admin/Messages";
import ContactInbox from "./pages/admin/ContactInbox";
import Settings from "./pages/admin/Settings";

// A shared layout for the public pages: navbar on top, footer below.
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      {/* Customer ⇄ admin chat is available on every public page. */}
      <ChatWidget />
    </>
  );
}

// A layout for the admin area: navbar + admin tabs, no marketing footer.
// While an admin is signed in, the chat inbox is polled for live updates.
function AdminLayout({ children }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      startAdminChatPolling();
      return stopAdminChatPolling;
    }
    return undefined;
  }, [isAuthenticated]);

  return (
    <>
      <Navbar />
      {isAuthenticated && <AdminNav />}
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    // AuthProvider wraps everything so any page can read the login state.
    <AuthProvider>
      {/* The simulation clock runs globally, so an active delivery keeps
          moving while the admin browses other pages or opens /live. */}
      <LiveTrackingProvider>
        <SettingsProvider>
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
            path="/live"
            element={
              <PublicLayout>
                <LiveMap />
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
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Messages />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contact"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <ContactInbox />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Settings />
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
        </SettingsProvider>
      </LiveTrackingProvider>
    </AuthProvider>
  );
}
