// -------------------------------------------------------------------
// Settings (/admin/settings) — admin profile, password and preferences.
// -------------------------------------------------------------------
// Sections:
//   1. Profile       — name, login email, phone
//   2. Security      — change password (with strength meter)
//   3. Chat          — welcome message + support email
//   4. Notifications — email alerts toggles
//   5. Simulation    — default speed used by the live control panel
//   6. Danger zone   — reset simulation / delete conversations
// -------------------------------------------------------------------

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBrand, useSiteSettings } from "../../context/SettingsContext";
import {
  changePassword,
  updatePreferences,
  updateProfile,
} from "../../api/auth";
import { useAdminAccount } from "../../lib/adminAccount";
import {
  clearAllConversations,
  unreadForAdmin,
  useChatStore,
} from "../../lib/chat";
import { resetLive } from "../../lib/liveTracking";
import { formatDate } from "../../utils/format";
import Icon from "../../components/Icon";
import "../../styles/admin.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SPEED_OPTIONS = [1, 2, 5, 10];

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

// 0 (weak) → 4 (strong). Purely a visual hint; the real rule is the
// minimum length enforced on submit.
function passwordScore(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(4, score);
}

const STRENGTH = [
  { label: "Too short", color: "#dc2626", width: "10%" },
  { label: "Weak", color: "#dc2626", width: "30%" },
  { label: "Fair", color: "#f59e0b", width: "55%" },
  { label: "Good", color: "#0ea5e9", width: "78%" },
  { label: "Strong", color: "#16a34a", width: "100%" },
];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { updateBrand } = useSiteSettings();
  const brand = useBrand();
  const account = useAdminAccount();
  const chatState = useChatStore();
  const unread = unreadForAdmin(chatState);

  const [brandFormErrors, setBrandFormErrors] = useState({});

  // ---------------- Profile ----------------
  const [profile, setProfile] = useState({
    name: account.name || "",
    email: account.email || "",
    phone: account.phone || "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // ---------------- Password ----------------
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  // ---------------- Preferences ----------------
  const [brandForm, setBrandForm] = useState({
    brandName: brand.name || "",
    supportEmail: brand.email || "",
    supportPhone: brand.phone || "",
    whatsappNumber: brand.whatsapp || "",
    chatWelcome: brand.chatWelcome || "",
  });
  const [notifyPrefs, setNotifyPrefs] = useState({
    notifyNewMessages: account.prefs.notifyNewMessages,
    notifyStatusChanges: account.prefs.notifyStatusChanges,
  });
  const [simPrefs, setSimPrefs] = useState({
    defaultSpeed: account.prefs.defaultSpeed,
  });
  const [savingPrefs, setSavingPrefs] = useState("");

  // Re-sync the brand form when the provider loads fresh values, using
  // the "compare during render" pattern (same as ShipmentsList) so no
  // wasted render happens.
  const [lastBrandKey, setLastBrandKey] = useState("");
  const brandKey = `${brand.name}|${brand.email}|${brand.phone}|${brand.whatsapp}|${brand.chatWelcome}`;
  if (brandKey !== lastBrandKey) {
    setLastBrandKey(brandKey);
    setBrandForm({
      brandName: brand.name || "",
      supportEmail: brand.email || "",
      supportPhone: brand.phone || "",
      whatsappNumber: brand.whatsapp || "",
      chatWelcome: brand.chatWelcome || "",
    });
    // Only clear form errors when the values actually changed from the
    // server (i.e. not on every keystroke — brandKey is stable then).
    if (lastBrandKey !== "") setBrandFormErrors({});
  }

  // Per-section feedback messages.
  const [status, setStatus] = useState({});
  const setSectionStatus = (section, tone, text) =>
    setStatus((previous) => ({ ...previous, [section]: { tone, text } }));

  const score = passwordScore(passwords.next);
  const strength = STRENGTH[score];

  // ---------------- Handlers ----------------
  const handleProfile = async (event) => {
    event.preventDefault();
    const next = {};
    if (!profile.name.trim()) next.name = "Your name is required.";
    if (!profile.email.trim()) next.email = "An email is required.";
    else if (!EMAIL_RE.test(profile.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    setProfileErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingProfile(true);
    setStatus((previous) => ({ ...previous, profile: null }));
    try {
      const updated = await updateProfile(profile);
      updateUser(updated);
      setProfile({
        name: updated.name,
        email: updated.email,
        phone: updated.phone || "",
      });
      setSectionStatus(
        "profile",
        "success",
        "Profile saved. Use the new email next time you sign in."
      );
    } catch (err) {
      setSectionStatus("profile", "error", err.message || "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    const next = {};
    if (!passwords.current) next.current = "Enter your current password.";
    if (!passwords.next) next.next = "Choose a new password.";
    else if (passwords.next.length < 8) {
      next.next = "Use at least 8 characters.";
    } else if (passwords.next === passwords.current) {
      next.next = "The new password must be different.";
    }
    if (passwords.confirm !== passwords.next) {
      next.confirm = "The passwords do not match.";
    }
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingPassword(true);
    setStatus((previous) => ({ ...previous, password: null }));
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setSectionStatus(
        "password",
        "success",
        "Password updated. Keep it somewhere safe."
      );
    } catch (err) {
      setSectionStatus("password", "error", err.message || "Could not update.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChatPrefs = async (event) => {
    event.preventDefault();
    const next = {};
    if (!brandForm.brandName.trim()) {
      next.brandName = "The brand name is required.";
    }
    if (!brandForm.chatWelcome.trim()) {
      next.chatWelcome = "The welcome message cannot be empty.";
    }
    if (!EMAIL_RE.test(brandForm.supportEmail.trim())) {
      next.supportEmail = "Enter a valid support email.";
    }
    if (!/^[0-9+()\-\s]{6,25}$/.test(brandForm.supportPhone.trim())) {
      next.supportPhone = "Enter a valid phone number.";
    }
    if (brandForm.whatsappNumber.replace(/\D/g, "").length < 8) {
      next.whatsappNumber =
        "Use 8 to 15 digits, country code first (e.g. 12125550142).";
    }
    setBrandFormErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingPrefs("brand");
    try {
      await updateBrand({
        brandName: brandForm.brandName.trim(),
        supportEmail: brandForm.supportEmail.trim(),
        supportPhone: brandForm.supportPhone.trim(),
        whatsappNumber: brandForm.whatsappNumber.trim(),
        chatWelcome: brandForm.chatWelcome.trim(),
      });
      setSectionStatus(
        "brand",
        "success",
        "Brand & contact settings saved. The whole site uses them right away."
      );
    } catch (err) {
      setSectionStatus("brand", "error", err.message || "Could not save.");
    } finally {
      setSavingPrefs("");
    }
  };

  const handleNotifyPrefs = async (event) => {
    event.preventDefault();
    setSavingPrefs("notify");
    try {
      await updatePreferences(notifyPrefs);
      setSectionStatus("notify", "success", "Notification settings saved.");
    } catch (err) {
      setSectionStatus("notify", "error", err.message || "Could not save.");
    } finally {
      setSavingPrefs("");
    }
  };

  const handleSimPrefs = async (event) => {
    event.preventDefault();
    setSavingPrefs("sim");
    try {
      await updatePreferences({
        defaultSpeed: Number(simPrefs.defaultSpeed),
      });
      setSectionStatus("sim", "success", "Default speed saved.");
    } catch (err) {
      setSectionStatus("sim", "error", err.message || "Could not save.");
    } finally {
      setSavingPrefs("");
    }
  };

  const handleResetSimulation = () => {
    if (!window.confirm("Reset the live simulation and clear the map?")) return;
    resetLive();
    setSectionStatus("danger", "success", "Live simulation reset.");
  };

  const handleClearChats = () => {
    if (
      !window.confirm(
        "Delete every conversation? Customers will start with an empty chat."
      )
    ) {
      return;
    }
    clearAllConversations();
    setSectionStatus("danger", "success", "All conversations deleted.");
  };

  const renderStatus = (section) => {
    const entry = status[section];
    if (!entry) return null;
    if (entry.tone === "success") {
      return (
        <span className="saved-note">
          <Icon name="check" size={15} /> {entry.text}
        </span>
      );
    }
    return (
      <span className="field-error" role="alert">
        {entry.text}
      </span>
    );
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Settings</h1>
          <p className="info-muted">
            Manage your account, password, chat and live tracking defaults.
          </p>
        </div>
      </header>

      <div className="settings-layout">
        {/* ---------------- Profile card ---------------- */}
        <aside className="card settings-profile">
          <div className="settings-avatar" aria-hidden="true">
            {initials(account.name)}
          </div>
          <h2>{account.name}</h2>
          <span className="role-pill">{account.role}</span>

          <div className="settings-meta">
            <div>
              <Icon name="mail" size={14} /> {account.email}
            </div>
            <div>
              <Icon name="phone" size={14} /> {account.phone || "No phone yet"}
            </div>
            <div>
              <Icon name="calendar" size={14} /> Member since{" "}
              {formatDate(account.joinedAt)}
            </div>
            <div>
              <Icon name="chat" size={14} /> {chatState.conversations.length}{" "}
              conversations · {unread} unread
            </div>
            <div>
              <Icon name="lock" size={14} /> Password changed:{" "}
              {account.passwordChangedAt
                ? formatDate(account.passwordChangedAt)
                : "never"}
            </div>
            {user?.email && user.email !== account.email && (
              <div>
                <Icon name="refresh" size={14} /> Session email: {user.email}
              </div>
            )}
          </div>
        </aside>

        <div className="settings-forms">
          {/* ---------------- Profile ---------------- */}
          <section className="card settings-section">
            <h2>
              <Icon name="shield" size={18} /> Profile information
            </h2>
            <p className="section-help">
              This is the name shown on the admin pages and the email used to
              sign in.
            </p>

            <form onSubmit={handleProfile} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="settings-name">Full name</label>
                  <input
                    id="settings-name"
                    className={`form-input ${
                      profileErrors.name ? "invalid" : ""
                    }`}
                    value={profile.name}
                    onChange={(event) =>
                      setProfile({ ...profile, name: event.target.value })
                    }
                    autoComplete="name"
                  />
                  {profileErrors.name && (
                    <p className="field-error">{profileErrors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="settings-email">Login email</label>
                  <input
                    id="settings-email"
                    type="email"
                    className={`form-input ${
                      profileErrors.email ? "invalid" : ""
                    }`}
                    value={profile.email}
                    onChange={(event) =>
                      setProfile({ ...profile, email: event.target.value })
                    }
                    autoComplete="email"
                  />
                  {profileErrors.email && (
                    <p className="field-error">{profileErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="settings-phone">Phone number</label>
                <input
                  id="settings-phone"
                  className="form-input"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  placeholder="+1 (212) 555-0142"
                  autoComplete="tel"
                />
              </div>

              <div className="settings-actions">
                {renderStatus("profile")}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------- Password ---------------- */}
          <section className="card settings-section">
            <h2>
              <Icon name="lock" size={18} /> Password &amp; security
            </h2>
            <p className="section-help">
              Use at least 8 characters. A mix of letters, numbers and symbols
              is best.
            </p>

            <form onSubmit={handlePassword} noValidate>
              <div className="form-group">
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  className={`form-input ${
                    passwordErrors.current ? "invalid" : ""
                  }`}
                  value={passwords.current}
                  onChange={(event) =>
                    setPasswords({ ...passwords, current: event.target.value })
                  }
                  autoComplete="current-password"
                />
                {passwordErrors.current && (
                  <p className="field-error">{passwordErrors.current}</p>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    className={`form-input ${
                      passwordErrors.next ? "invalid" : ""
                    }`}
                    value={passwords.next}
                    onChange={(event) =>
                      setPasswords({ ...passwords, next: event.target.value })
                    }
                    autoComplete="new-password"
                  />
                  {passwords.next && (
                    <>
                      <div className="strength" aria-hidden="true">
                        <span
                          style={{
                            width: strength.width,
                            background: strength.color,
                          }}
                        />
                      </div>
                      <p className="strength-text">
                        Password strength: {strength.label}
                      </p>
                    </>
                  )}
                  {passwordErrors.next && (
                    <p className="field-error">{passwordErrors.next}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className={`form-input ${
                      passwordErrors.confirm ? "invalid" : ""
                    }`}
                    value={passwords.confirm}
                    onChange={(event) =>
                      setPasswords({
                        ...passwords,
                        confirm: event.target.value,
                      })
                    }
                    autoComplete="new-password"
                  />
                  {passwordErrors.confirm && (
                    <p className="field-error">{passwordErrors.confirm}</p>
                  )}
                </div>
              </div>

              <div className="settings-actions">
                {renderStatus("password")}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPassword}
                >
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------- Brand & contact ---------------- */}
          <section className="card settings-section">
            <h2>
              <Icon name="chat" size={18} /> Brand &amp; contact
            </h2>
            <p className="section-help">
              These values are shown across the whole public site: navbar,
              footer, contact page, pricing and the chat bubble. They live in
              the database — no redeploy needed after a change.
            </p>

            <form onSubmit={handleChatPrefs} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="brand-name">Brand name</label>
                  <input
                    id="brand-name"
                    className={`form-input ${
                      brandFormErrors.brandName ? "invalid" : ""
                    }`}
                    value={brandForm.brandName}
                    onChange={(event) =>
                      setBrandForm({
                        ...brandForm,
                        brandName: event.target.value,
                      })
                    }
                  />
                  {brandFormErrors.brandName && (
                    <p className="field-error">{brandFormErrors.brandName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="support-phone">Support phone</label>
                  <input
                    id="support-phone"
                    className={`form-input ${
                      brandFormErrors.supportPhone ? "invalid" : ""
                    }`}
                    value={brandForm.supportPhone}
                    onChange={(event) =>
                      setBrandForm({
                        ...brandForm,
                        supportPhone: event.target.value,
                      })
                    }
                    placeholder="+1 (212) 555-0142"
                  />
                  {brandFormErrors.supportPhone && (
                    <p className="field-error">{brandFormErrors.supportPhone}</p>
                  )}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="support-email">Support email</label>
                  <input
                    id="support-email"
                    type="email"
                    className={`form-input ${
                      brandFormErrors.supportEmail ? "invalid" : ""
                    }`}
                    value={brandForm.supportEmail}
                    onChange={(event) =>
                      setBrandForm({
                        ...brandForm,
                        supportEmail: event.target.value,
                      })
                    }
                    placeholder="support@swifttrack.com"
                  />
                  {brandFormErrors.supportEmail && (
                    <p className="field-error">{brandFormErrors.supportEmail}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="whatsapp-number">WhatsApp number</label>
                  <input
                    id="whatsapp-number"
                    className={`form-input ${
                      brandFormErrors.whatsappNumber ? "invalid" : ""
                    }`}
                    value={brandForm.whatsappNumber}
                    onChange={(event) =>
                      setBrandForm({
                        ...brandForm,
                        whatsappNumber: event.target.value,
                      })
                    }
                    placeholder="12125550142"
                  />
                  {brandFormErrors.whatsappNumber && (
                    <p className="field-error">
                      {brandFormErrors.whatsappNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="chat-welcome">Chat welcome message</label>
                <textarea
                  id="chat-welcome"
                  className="form-input"
                  rows={3}
                  value={brandForm.chatWelcome}
                  onChange={(event) =>
                    setBrandForm({
                      ...brandForm,
                      chatWelcome: event.target.value,
                    })
                  }
                />
                {brandFormErrors.chatWelcome && (
                  <p className="field-error">{brandFormErrors.chatWelcome}</p>
                )}
              </div>

              <div className="settings-actions">
                {renderStatus("brand")}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPrefs === "brand"}
                >
                  {savingPrefs === "brand" ? "Saving…" : "Save brand settings"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------- Notifications ---------------- */}
          <section className="card settings-section">
            <h2>
              <Icon name="bell" size={18} /> Notifications
            </h2>
            <p className="section-help">
              Choose which alerts the operations inbox should send you.
            </p>

            <form onSubmit={handleNotifyPrefs}>
              <div className="toggle-row">
                <div className="toggle-text">
                  <strong>New customer messages</strong>
                  <span>Get alerted as soon as someone starts a chat.</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifyPrefs.notifyNewMessages}
                    onChange={(event) =>
                      setNotifyPrefs({
                        ...notifyPrefs,
                        notifyNewMessages: event.target.checked,
                      })
                    }
                    aria-label="Notify me about new customer messages"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-text">
                  <strong>Shipment status changes</strong>
                  <span>
                    Alerts when a parcel is delayed, delivered or rerouted.
                  </span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifyPrefs.notifyStatusChanges}
                    onChange={(event) =>
                      setNotifyPrefs({
                        ...notifyPrefs,
                        notifyStatusChanges: event.target.checked,
                      })
                    }
                    aria-label="Notify me about shipment status changes"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="settings-actions">
                {renderStatus("notify")}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPrefs === "notify"}
                >
                  {savingPrefs === "notify" ? "Saving…" : "Save notifications"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------- Simulation defaults ---------------- */}
          <section className="card settings-section">
            <h2>
              <Icon name="radar" size={18} /> Live simulation defaults
            </h2>
            <p className="section-help">
              The speed used when the dashboard control panel starts a new
              route. You can still change it per run.
            </p>

            <form onSubmit={handleSimPrefs}>
              <div className="form-group">
                <label htmlFor="default-speed">Default simulation speed</label>
                <select
                  id="default-speed"
                  className="form-input"
                  value={simPrefs.defaultSpeed}
                  onChange={(event) =>
                    setSimPrefs({
                      defaultSpeed: Number(event.target.value),
                    })
                  }
                >
                  {SPEED_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}× {option === 1 ? "(2 minutes)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="settings-actions">
                {renderStatus("sim")}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPrefs === "sim"}
                >
                  {savingPrefs === "sim" ? "Saving…" : "Save default"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------------- Danger zone ---------------- */}
          <section className="card settings-section danger-zone">
            <h2>
              <Icon name="bell" size={18} /> Danger zone
            </h2>
            <p className="section-help">
              These actions cannot be undone. They only affect the demo data
              stored in this browser.
            </p>

            <div className="danger-row">
              <div>
                <strong>Reset live simulation</strong>
                <span>Stop the moving parcel and clear the public live map.</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetSimulation}
              >
                Reset simulation
              </button>
            </div>

            <div className="danger-row">
              <div>
                <strong>Delete all conversations</strong>
                <span>Remove every customer chat from the inbox.</span>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearChats}
              >
                Delete chats
              </button>
            </div>

            <div className="settings-actions">
              {renderStatus("danger")}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
