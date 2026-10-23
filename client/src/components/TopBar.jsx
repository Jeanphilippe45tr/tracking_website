// -------------------------------------------------------------------
// TopBar — thin utility strip above the main navbar.
// -------------------------------------------------------------------
// Holds the phone number, the customer-service e-mail and the
// language / currency switcher, exactly like the big carrier sites.
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import Icon from "./Icon";
import { BRAND, NAV } from "../data/site";
import "../styles/layout.css";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="container topbar-inner">
        <ul className="topbar-info">
          <li>
            <Icon name="phone" size={15} />
            <a href={`tel:${BRAND.phoneHref}`}>{BRAND.phone}</a>
          </li>
          <li className="topbar-hide-sm">
            <Icon name="mail" size={15} />
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
          </li>
          <li className="topbar-hide-md">
            <Icon name="clock" size={15} />
            <span>{BRAND.hours}</span>
          </li>
        </ul>

        <ul className="topbar-links">
          <li className="topbar-hide-md">
            <Link to={NAV.help.to}>Help centre</Link>
          </li>
          <li className="topbar-hide-md">
            <Link to="/track">Track a parcel</Link>
          </li>
          <li>
            <button type="button" className="topbar-select">
              <Icon name="language" size={15} />
              <span>EN</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="topbar-select"
              title="All prices are shown in US dollars"
              aria-label="Currency: US dollar"
            >
              <span>USD</span>
              <Icon name="chevronDown" size={13} />
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
