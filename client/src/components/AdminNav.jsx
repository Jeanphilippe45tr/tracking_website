// -------------------------------------------------------------------
// AdminNav — sub-navigation shown on every admin page.
// -------------------------------------------------------------------
// Keeps Dashboard / Shipments / Messages / Settings one click apart and
// shows the unread message count.
// -------------------------------------------------------------------

import { NavLink } from "react-router-dom";
import { unreadForAdmin, useChatStore } from "../lib/chat";
import Icon from "./Icon";

const ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "box", end: true },
  { to: "/admin/shipments", label: "Shipments", icon: "parcel" },
  { to: "/admin/messages", label: "Messages", icon: "chat", badge: true },
  { to: "/admin/settings", label: "Settings", icon: "shield" },
];

export default function AdminNav() {
  const chatState = useChatStore();
  const unread = unreadForAdmin(chatState);

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      <div className="container admin-nav-inner">
        <span className="admin-nav-label">
          <Icon name="lock" size={13} /> Staff area
        </span>

        <div className="admin-nav-links">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon name={item.icon} size={16} />
              {item.label}
              {item.badge && unread > 0 && (
                <span className="admin-nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
