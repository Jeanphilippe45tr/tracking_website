// -------------------------------------------------------------------
// Track — landing page for /track (search form + help + demos).
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import FaqList from "../components/FaqList";
import Icon from "../components/Icon";
import { BRAND, DEMO_NUMBERS, FAQ_HOME, IMAGES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

const WAYS = [
  {
    icon: "mail",
    title: "From your confirmation email",
    text: "The number sits right under “Your parcel is on its way”.",
  },
  {
    icon: "invoice",
    title: "From your receipt",
    text: "Printed at the bottom of the drop-off receipt you signed.",
  },
  {
    icon: "chat",
    title: "From the SMS we sent you",
    text: "A short message with the number and a direct tracking link.",
  },
];

export default function Track() {
  return (
    <div className="page">
      <PageHero
        eyebrow="Parcel tracking"
        title="Track any parcel in seconds"
        subtitle="Paste the tracking number you received by email, SMS or on your receipt. No account needed, no app to install."
        image={IMAGES.fleet}
        compact
      />

      {/* ---------------- SEARCH CARD ---------------- */}
      <section className="section">
        <div className="container">
          <div className="track-search-panel card">
            <h2 className="track-search-title">
              <Icon name="parcel" size={22} /> Where is my parcel?
            </h2>
            <p className="track-search-text">
              Tracking numbers look like <code>TRK000000001</code> — 12
              characters, always starting with TRK.
            </p>

            <SearchBox size="large" placeholder="e.g. TRK000000001" autoFocus />

            <div className="track-demo-list">
              <p className="track-demo-title">No parcel at hand? Try one of these:</p>
              <ul>
                {DEMO_NUMBERS.map((demo) => (
                  <li key={demo.number}>
                    <Link to={`/track/${demo.number}`}>
                      <span className="track-demo-number">{demo.number}</span>
                      <span className="track-demo-meta">
                        <strong>{demo.label}</strong>
                        <small>{demo.hint}</small>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---------------- WHERE TO FIND THE NUMBER ---------------- */}
          <div className="track-ways">
            {WAYS.map((way) => (
              <div key={way.title} className="track-way card">
                <span className="track-way-icon">
                  <Icon name={way.icon} size={20} />
                </span>
                <div>
                  <h3>{way.title}</h3>
                  <p>{way.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TRACKING FEATURES ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="What you get"
            title="A complete file on your parcel"
            subtitle="Every scan, every location, every document — organised on one page."
          />

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-icon">
                <Icon name="radar" size={28} />
              </span>
              <h3>Live position</h3>
              <p>The last confirmed scan of your parcel, plotted on a map.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon">
                <Icon name="clock" size={28} />
              </span>
              <h3>Estimated delivery</h3>
              <p>A date and time window, updated with every new scan.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon">
                <Icon name="invoice" size={28} />
              </span>
              <h3>Full history</h3>
              <p>Who handled your parcel, where and when — scan by scan.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon">
                <Icon name="bell" size={28} />
              </span>
              <h3>Notifications</h3>
              <p>Email and SMS alerts the moment your parcel moves.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ + SUPPORT ---------------- */}
      <section className="section">
        <div className="container container-narrow">
          <SectionHeading
            eyebrow="FAQ"
            title="Tracking questions"
            subtitle="The answers our support team gives most often."
          />

          <FaqList items={FAQ_HOME} />

          <div className="track-support card">
            <div>
              <h3>Still stuck?</h3>
              <p>
                Our team answers in French and English, seven days a week, and
                usually replies within two minutes.
              </p>
            </div>
            <div className="track-support-actions">
              <a href={`tel:${BRAND.phoneHref}`} className="btn btn-primary">
                <Icon name="phone" size={16} /> {BRAND.phone}
              </a>
              <Link to="/contact" className="btn btn-outline">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
