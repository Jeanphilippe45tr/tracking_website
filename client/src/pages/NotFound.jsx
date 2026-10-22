// -------------------------------------------------------------------
// NotFound — 404 page (also used for unknown routes).
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { IMAGES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

const SUGGESTIONS = [
  { to: "/track", label: "Track a parcel", icon: "parcel" },
  { to: "/relay-points", label: "Find a relay point", icon: "pin" },
  { to: "/pricing", label: "See our rates", icon: "invoice" },
  { to: "/contact", label: "Contact support", icon: "chat" },
];

export default function NotFound() {
  return (
    <div className="page">
      <section
        className="page-hero compact"
        style={{ backgroundImage: `url(${IMAGES.boxes})` }}
      >
        <div className="page-hero-overlay" />
        <div className="container page-hero-inner">
          <p className="notfound-code">404</p>
          <h1 className="page-hero-title">This parcel went missing</h1>
          <p className="page-hero-subtitle">
            The page you are looking for does not exist or has been moved. Here
            is where you can go instead.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="notfound-card card">
          <span className="notfound-icon" aria-hidden="true">
            <Icon name="parcel" size={46} />
          </span>
          <h2>Where would you like to go?</h2>

          <ul className="notfound-links">
            {SUGGESTIONS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>
                  <Icon name={item.icon} size={18} />
                  {item.label}
                  <Icon name="arrowRight" size={16} />
                </Link>
              </li>
            ))}
          </ul>

          <div className="section-cta">
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
