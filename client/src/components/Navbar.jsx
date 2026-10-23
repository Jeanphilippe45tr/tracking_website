// -------------------------------------------------------------------
// Navbar — top navigation with dropdown menus and a mobile drawer.
// -------------------------------------------------------------------

import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopBar from "./TopBar";
import Logo from "./Logo";
import Icon from "./Icon";
import { NAV } from "../data/site";
import "../styles/layout.css";

export default function Navbar() {
  // Controls the mobile menu open/close state.
  const [open, setOpen] = useState(false);
  // Name of the dropdown that is currently open (desktop + mobile).
  const [dropdown, setDropdown] = useState(null);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navRef = useRef(null);

  // Close the menu after clicking any link (nice on mobile).
  const closeMenu = () => {
    setOpen(false);
    setDropdown(null);
  };

  // Clicking outside the header closes any open dropdown.
  useEffect(() => {
    const onClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setDropdown(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The Escape key closes the dropdowns as well (accessibility).
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setDropdown(null);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  // NavLink adds an "active" class automatically on the current route.
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  // Renders a top-level link, optionally with a dropdown panel.
  const renderMenuItem = (item, key) => {
    if (!item.items) {
      return (
        <NavLink key={key} to={item.to} className={linkClass} onClick={closeMenu}>
          {item.label}
        </NavLink>
      );
    }

    const isOpen = dropdown === key;

    return (
      <div
        key={key}
        className={`nav-item has-dropdown ${isOpen ? "open" : ""}`}
        onMouseEnter={() => setDropdown(key)}
        onMouseLeave={() => setDropdown(null)}
      >
        <button
          type="button"
          className="nav-link nav-dropdown-trigger"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setDropdown(isOpen ? null : key)}
        >
          {item.label}
          <Icon name="chevronDown" size={14} className="nav-caret" />
        </button>

        <div className="nav-dropdown" role="menu">
          {item.items.map((sub) => (
            <Link
              key={sub.to}
              to={sub.to}
              className="nav-dropdown-item"
              role="menuitem"
              onClick={closeMenu}
            >
              <span className="nav-dropdown-title">{sub.title}</span>
              <span className="nav-dropdown-text">{sub.text}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <header className="site-header" ref={navRef}>
      <TopBar />

      <div className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <Logo />
          </Link>

          {/* Hamburger button: only visible on small screens (see CSS). */}
          <button
            type="button"
            className="nav-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Icon name="close" size={22} /> : <Icon name="menu" size={22} />}
          </button>

          <nav className={`nav-links ${open ? "open" : ""}`}>
            {renderMenuItem(NAV.services, "services")}
            {renderMenuItem(NAV.company, "company")}

            <NavLink to={NAV.pricing.to} className={linkClass} onClick={closeMenu}>
              {NAV.pricing.label}
            </NavLink>
            <NavLink to="/live" className={linkClass} onClick={closeMenu}>
              Live map
            </NavLink>
            <NavLink to={NAV.relay.to} className={linkClass} onClick={closeMenu}>
              {NAV.relay.label}
            </NavLink>
            <NavLink to={NAV.help.to} className={linkClass} onClick={closeMenu}>
              {NAV.help.label}
            </NavLink>
            <NavLink to={NAV.contact.to} className={linkClass} onClick={closeMenu}>
              {NAV.contact.label}
            </NavLink>

            {/* Admin area link changes depending on login state. */}
            {isAuthenticated ? (
              <>
                <NavLink to="/admin" className={linkClass} onClick={closeMenu} end>
                  Dashboard
                </NavLink>
                <button
                  type="button"
                  className="btn btn-outline btn-sm nav-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/admin/login"
                className={linkClass}
                onClick={closeMenu}
              >
                Admin
              </NavLink>
            )}

            <Link
              to={NAV.track.to}
              className="btn btn-primary nav-cta"
              onClick={closeMenu}
            >
              <Icon name="parcel" size={18} />
              Track a parcel
            </Link>
          </nav>
        </div>
      </div>

      {/* Announcement ticker — sits under the navbar like the big carriers. */}
      <div className="announce">
        <div className="container announce-inner">
          <span className="announce-badge">
            <Icon name="bell" size={14} /> News
          </span>
          <p>
            Transatlantic shipping to Europe is now{" "}
            <strong>15% cheaper</strong> for the whole of October — duties
            included.
          </p>
          <Link to="/pricing" className="announce-link">
            See rates <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
