// -------------------------------------------------------------------
// Contact — contact form (front-end validation only) + short FAQ.
// -------------------------------------------------------------------

import { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import FaqList from "../components/FaqList";
import Icon from "../components/Icon";
import { BRAND, IMAGES, OFFICES } from "../data/site";
import { submitContactForm } from "../api/shipments";
import "../styles/pages.css";
import "../styles/content.css";

// FAQ items — kept here so the JSX stays readable.
const FAQ = [
  {
    q: "How long does delivery usually take?",
    a: "Local deliveries within the same city usually take 1–2 working days. International shipments take 5–10 working days depending on customs.",
  },
  {
    q: "My tracking number is not recognised. What should I do?",
    a: "Double-check the number (it looks like TRK000000001). If it still fails, the parcel may have just been created — please try again in a few hours.",
  },
  {
    q: "Can I change the delivery address?",
    a: "Yes, as long as the parcel has not been handed to the delivery van yet. Contact our support team with your tracking number.",
  },
  {
    q: "What happens if delivery fails?",
    a: "Our courier will try again the next working day, or leave the parcel at the nearest relay point for you to collect.",
  },
];

const EMPTY = { name: "", email: "", subject: "", message: "", "tracking-ref": "" };

export default function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
    if (sent) setSent(false);
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Your name is required.";

    if (!values.email.trim()) {
      next.email = "Your email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!values.subject.trim()) next.subject = "A subject is required.";

    if (!values.message.trim()) {
      next.message = "Please write a message.";
    } else if (values.message.trim().length < 10) {
      next.message = "Your message should be at least 10 characters.";
    }

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
      await submitContactForm({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        trackingNumber: values["tracking-ref"]?.trim() || "",
      });
      setLoading(false);
      setSent(true);
      setValues(EMPTY);
    } catch (err) {
      setLoading(false);
      setApiError(err.message || "Could not send message. Please try again.");
    }
  };

  return (
    <div className="page">
      <PageHero
        eyebrow="Contact"
        title="We are here to help"
        subtitle="A question about a parcel, a rate or a custom shipment? Send us a message — we reply in under two minutes, seven days a week."
        image={IMAGES.counter}
        compact
      />

      {/* ---------------- QUICK CONTACT ---------------- */}
      <section className="contact-channels">
        <div className="container contact-channels-grid">
          <a href={`tel:${BRAND.phoneHref}`} className="contact-channel card">
            <span className="contact-channel-icon">
              <Icon name="phone" size={22} />
            </span>
            <span>
              <strong>Call us</strong>
              <small>{BRAND.phone}</small>
            </span>
          </a>
          <a href={`mailto:${BRAND.email}`} className="contact-channel card">
            <span className="contact-channel-icon">
              <Icon name="mail" size={22} />
            </span>
            <span>
              <strong>Email us</strong>
              <small>{BRAND.email}</small>
            </span>
          </a>
          <a href={`https://wa.me/${BRAND.phoneHref.replace(/\D/g, "")}`} className="contact-channel card" target="_blank" rel="noreferrer noopener">
            <span className="contact-channel-icon">
              <Icon name="chat" size={22} />
            </span>
            <span>
              <strong>WhatsApp</strong>
              <small>{BRAND.whatsapp}</small>
            </span>
          </a>
          <div className="contact-channel card">
            <span className="contact-channel-icon">
              <Icon name="clock" size={22} />
            </span>
            <span>
              <strong>Opening hours</strong>
              <small>{BRAND.hours}</small>
            </span>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="contact-layout">
          {/* ---------------- Contact form ---------------- */}
          <form className="form card" onSubmit={handleSubmit} noValidate>
            <h2 className="form-title">Send us a message</h2>

            {sent && (
              <div className="alert alert-success" role="status">
                ✅ Thanks! Your message has been sent. We will reply soon.
              </div>
            )}

            {apiError && (
              <div className="alert alert-error" role="alert">
                {apiError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? "invalid" : ""}`}
                value={values.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="field-error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Your email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? "invalid" : ""}`}
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="field-error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                name="subject"
                className={`form-input ${errors.subject ? "invalid" : ""}`}
                value={values.subject}
                onChange={handleChange}
                aria-invalid={Boolean(errors.subject)}
              >
                <option value="">Choose a topic…</option>
                <option value="tracking">A parcel that is not moving</option>
                <option value="address">Change the delivery address</option>
                <option value="customs">Customs and duties</option>
                <option value="relay">A relay point question</option>
                <option value="quote">A quote for a business shipment</option>
                <option value="other">Something else</option>
              </select>
              {errors.subject && (
                <p className="field-error" role="alert">
                  {errors.subject}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                className={`form-input ${errors.message ? "invalid" : ""}`}
                value={values.message}
                onChange={handleChange}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message && (
                <p className="field-error" role="alert">
                  {errors.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tracking-ref">Tracking number (optional)</label>
              <input
                id="tracking-ref"
                name="tracking-ref"
                type="text"
                className="form-input"
                placeholder="TRK000000001"
                value={values["tracking-ref"] || ""}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Sending..." : "Send message"}
            </button>
          </form>

          {/* ---------------- FAQ ---------------- */}
          <aside className="faq">
            <h2 className="form-title">Frequently asked questions</h2>
            {/* Using <details> gives us an accordion without any JS. */}
            <FaqList items={FAQ} />

            <div className="contact-offices">
              <h3>Our offices</h3>
              {OFFICES.map((office) => (
                <div key={office.city} className="contact-office">
                  <strong>
                    {office.city} <small>— {office.role}</small>
                  </strong>
                  <p>
                    <Icon name="pin" size={13} /> {office.address}
                  </p>
                  <p>
                    <Icon name="phone" size={13} /> {office.phone}
                  </p>
                </div>
              ))}
              <Link to="/relay-points" className="link-btn">
                Find the nearest relay point →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------------- LOCATIONS ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="Where to find us"
            title="Three counters, one team"
            subtitle="Come to the office with your parcel, or simply call ahead so we can prepare your file."
          />

          <div className="office-grid">
            {OFFICES.map((office) => (
              <article key={office.city} className="office-card card">
                <h3>{office.city}</h3>
                <p className="office-role">{office.role}</p>
                <ul>
                  <li>
                    <Icon name="pin" size={15} /> {office.address}
                  </li>
                  <li>
                    <Icon name="phone" size={15} /> {office.phone}
                  </li>
                  <li>
                    <Icon name="clock" size={15} /> {office.hours}
                  </li>
                </ul>
                <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="office-link">
                  Call this office <Icon name="arrowRight" size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
