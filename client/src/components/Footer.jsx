// -------------------------------------------------------------------
// Footer — site links, newsletter form and legal bar.
// -------------------------------------------------------------------

import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import { SOCIALS, COUNTRIES } from "../data/site";
import { useBrand } from "../context/SettingsContext";
import { subscribeToNewsletter } from "../api/contactApi";
import "../styles/layout.css";

const COLUMNS = [
  {
    title: "Track & ship",
    links: [
      { label: "Track a parcel", to: "/track" },
      { label: "Live parcel map", to: "/live" },
      { label: "Find a relay point", to: "/relay-points" },
      { label: "Rates & pricing", to: "/pricing" },
      { label: "Shipping guide", to: "/help" },
      { label: "Request a quote", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About SwiftTrack", to: "/about" },
      { label: "Help centre", to: "/help" },
      { label: "Contact us", to: "/contact" },
      { label: "Careers", to: "/about#careers" },
      { label: "Partners", to: "/about#partners" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Express delivery", to: "/services#express" },
      { label: "International shipping", to: "/services#international" },
      { label: "Relay points", to: "/services#relay" },
      { label: "Freight & cargo", to: "/services#freight" },
      { label: "E-commerce logistics", to: "/services#ecommerce" },
    ],
  },
];

export default function Footer() {
  const brand = useBrand();
  // The year is calculated so the copyright never goes stale.
  const year = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribedMessage, setSubscribedMessage] = useState("");
  const [newsletterError, setNewsletterError] = useState("");

  const handleSubscribe = async (event) => {
    event.preventDefault();
    setNewsletterError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    try {
      const result = await subscribeToNewsletter(email.trim());
      setSubscribed(true);
      setSubscribedMessage(result.message || "You are on the list.");
      setEmail("");
    } catch (err) {
      setNewsletterError(err.message || "Could not subscribe — try again.");
    }
  };

  return (
    <footer className="footer">
      {/* ---------------- TOP: newsletter + promise ---------------- */}
      <div className="footer-newsletter">
        <div className="container footer-newsletter-inner">
          <div>
            <h3>Get delivery updates in your inbox</h3>
            <p>
              Shipment notifications, service announcements and the monthly
              rate card. No spam, unsubscribe in one click.
            </p>
          </div>

          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              className="newsletter-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubscribed(false);
              }}
              required
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
            {subscribed && (
              <p className="newsletter-ok" role="status">
                <Icon name="check" size={15} /> {subscribedMessage || "You are on the list."}
              </p>
            )}
            {newsletterError && (
              <p className="newsletter-error" role="alert">
                {newsletterError}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ---------------- MIDDLE: link columns ---------------- */}
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo size={32} />
          <p className="footer-tagline">
            Fast, reliable parcel tracking across the US, Europe and Asia.
          </p>

          <ul className="footer-contact">
            <li>
              <Icon name="phone" size={16} />
              <a href={`tel:${brand.phoneHref}`}>{brand.phone}</a>
            </li>
            <li>
              <Icon name="mail" size={16} />
              <a href={`mailto:${brand.email}`}>{brand.email}</a>
            </li>
            <li>
              <Icon name="pin" size={16} />
              <span>{brand.address}</span>
            </li>
            <li>
              <Icon name="clock" size={16} />
              <span>{brand.hours}</span>
            </li>
          </ul>

          <ul className="footer-socials">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                >
                  <Icon name={social.icon} size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <div className="footer-col" key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* ---------------- COUNTRIES STRIP ---------------- */}
      <div className="container footer-countries">
        <span className="footer-countries-label">
          Shipping to 180+ countries
        </span>
        <ul>
          {COUNTRIES.slice(0, 10).map((country) => (
            <li key={`${country.code}-${country.name}`}>
              <img
                src={`https://flagcdn.com/w40/${country.code}.png`}
                alt=""
                width="20"
                height="15"
                loading="lazy"
              />
              {country.name}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------------- BOTTOM: legal bar ---------------- */}
      <div className="container footer-bottom">
        <p>© {year} {brand.name}. All rights reserved.</p>

        <ul className="footer-legal">
          <li>
            <Link to="/terms">Terms &amp; conditions</Link>
          </li>
          <li>
            <Link to="/privacy">Privacy policy</Link>
          </li>
          <li>
            <Link to="/help">Shipping guide</Link>
          </li>
          <li>
            <Link to="/admin/login">Staff login</Link>
          </li>
        </ul>

        <ul className="footer-payments" aria-label="Accepted payment methods">
          <li>VISA</li>
          <li>mastercard</li>
          <li>AMEX</li>
          <li>PayPal</li>
        </ul>
      </div>
    </footer>
  );
}
