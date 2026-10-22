// -------------------------------------------------------------------
// Home page — hero search, services, coverage, reviews and FAQ.
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import SectionHeading from "../components/SectionHeading";
import CarrierStrip from "../components/CarrierStrip";
import StatsBand from "../components/StatsBand";
import Testimonials from "../components/Testimonials";
import FaqList from "../components/FaqList";
import CtaBand from "../components/CtaBand";
import Icon from "../components/Icon";
import {
  BRAND,
  COUNTRIES,
  FAQ_HOME,
  IMAGES,
  SERVICES,
  STEPS,
  TRUST_POINTS,
  DEMO_NUMBERS,
} from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

export default function Home() {
  return (
    <div className="page">
      {/* ---------------- HERO ---------------- */}
      <section className="hero" style={{ backgroundImage: `url(${IMAGES.hero})` }}>
        <div className="hero-overlay" />
        <div className="container hero-inner">
          <p className="hero-eyebrow">
            <Icon name="radar" size={16} />
            Live parcel tracking in 180+ countries
          </p>
          <h1 className="hero-title">
            Where is my <span>parcel?</span>
          </h1>
          <p className="hero-subtitle">
            Track your shipment in real time — from the moment it is picked up
            in Douala to the moment it is signed for in Paris. No account, no
            app, just your tracking number.
          </p>

          <div className="hero-search-card">
            <SearchBox size="large" autoFocus />
            <p className="hero-hint">
              Try a demo number:{" "}
              {DEMO_NUMBERS.slice(0, 3).map((demo, index) => (
                <span key={demo.number}>
                  <Link to={`/track/${demo.number}`} className="hero-demo">
                    {demo.number}
                  </Link>
                  {index < 2 && " · "}
                </span>
              ))}
            </p>
          </div>

          <ul className="hero-badges">
            <li>
              <Icon name="shield" size={16} /> Insured up to 500 000 FCFA
            </li>
            <li>
              <Icon name="bolt" size={16} /> Scans updated every hour
            </li>
            <li>
              <Icon name="headset" size={16} /> Support 7 days a week
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------- CARRIERS ---------------- */}
      <CarrierStrip title="One tracking page for every carrier we work with" />

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps, thirty seconds"
            subtitle="No sign-up, no password — just paste the number you received by email or SMS."
          />

          <div className="steps-grid">
            {STEPS.map((step, index) => (
              <article key={step.title} className="step-card card">
                <span className="step-card-number">{index + 1}</span>
                <span className="step-card-icon" aria-hidden="true">
                  <Icon name={step.icon} size={30} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SERVICES ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="What we do"
            title="Services built for parcels and cargo"
            subtitle="From a single document to a full container — the same live tracking on everything we carry."
          />

          <div className="service-grid">
            {SERVICES.map((service) => (
              <article key={service.id} className="service-card card">
                <div className="service-card-media">
                  <img src={service.image} alt="" loading="lazy" />
                  <span className="service-card-icon">
                    <Icon name={service.icon} size={22} />
                  </span>
                </div>
                <div className="service-card-body">
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <ul className="service-points">
                    {service.points.map((point) => (
                      <li key={point}>
                        <Icon name="check" size={14} /> {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/services#${service.id}`}
                    className="service-card-link"
                  >
                    Learn more <Icon name="arrowRight" size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <StatsBand image={IMAGES.port} />

      {/* ---------------- WHY US ---------------- */}
      <section className="section">
        <div className="container why-layout">
          <div className="why-media">
            <img src={IMAGES.warehouse} alt="Parcels being sorted in a SwiftTrack hub" loading="lazy" />
            <div className="why-media-card">
              <span className="why-media-value">12</span>
              <span className="why-media-label">
                sorting hubs across
                <br />
                Cameroon and France
              </span>
            </div>
          </div>

          <div className="why-content">
            <SectionHeading
              eyebrow="Why SwiftTrack"
              title="Serious logistics behind a simple page"
              subtitle="We are not a middleman. We scan, sort and deliver the parcel ourselves — which is why the information on your screen is always accurate."
              align="left"
            />

            <div className="trust-grid">
              {TRUST_POINTS.map((point) => (
                <div key={point.title} className="trust-item">
                  <span className="trust-icon">
                    <Icon name={point.icon} size={20} />
                  </span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/about" className="btn btn-secondary">
              About our company <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- COVERAGE ---------------- */}
      <section className="section section-dark">
        <div className="container">
          <SectionHeading
            eyebrow="Coverage"
            title="We deliver across Africa, Europe and beyond"
            subtitle="Our own offices in Cameroon and France, plus partners on every route we sell."
            light
          />

          <ul className="country-grid">
            {COUNTRIES.map((country) => (
              <li key={`${country.code}-${country.name}`} className="country-card">
                <img
                  src={`https://flagcdn.com/w80/${country.code}.png`}
                  alt=""
                  width="40"
                  height="30"
                  loading="lazy"
                />
                <span className="country-name">{country.name}</span>
                <span className="country-hubs">{country.hubs} hubs</span>
              </li>
            ))}
          </ul>

          <div className="section-cta">
            <Link to="/pricing" className="btn btn-primary btn-lg">
              See rates &amp; transit times
            </Link>
            <Link to="/services" className="btn btn-ghost btn-lg">
              Explore our services
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- RELAY POINTS TEASER ---------------- */}
      <section className="section">
        <div className="container relay-teaser">
          <div className="relay-teaser-media">
            <img
              src={IMAGES.shop}
              alt="A SwiftTrack relay point inside a partner shop"
              loading="lazy"
            />
            <div className="relay-teaser-badge">
              <Icon name="pin" size={20} />
              <span>
                <strong>2 400+</strong>
                relay points
              </span>
            </div>
          </div>

          <div className="relay-teaser-content">
            <SectionHeading
              eyebrow="Relay points"
              title="Collect your parcel where it suits you"
              subtitle="Maybe you are not at home between 9am and 5pm. That is fine — the parcel waits for you at a partner shop near your home or your office."
              align="left"
            />

            <ul className="tick-list">
              <li>
                <Icon name="check" size={16} /> Open late, on Saturdays and on
                public holidays
              </li>
              <li>
                <Icon name="check" size={16} /> Pay on collection, even in cash
              </li>
              <li>
                <Icon name="check" size={16} /> Live availability and opening
                hours on the map
              </li>
              <li>
                <Icon name="check" size={16} /> Ten days of free storage
              </li>
            </ul>

            <Link to="/relay-points" className="btn btn-primary">
              <Icon name="map" size={17} />
              Find the nearest relay point
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="Reviews"
            title="What our customers say"
            subtitle="4.8 out of 5 from more than 9 400 parcel owners."
          />

          <Testimonials />

          <div className="section-cta">
            <Link to="/contact" className="btn btn-outline">
              Read more reviews
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="section">
        <div className="container container-narrow">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions we are asked every day"
            subtitle="Cannot find your answer? Our team replies in under two minutes."
          />

          <FaqList items={FAQ_HOME} />

          <div className="section-cta">
            <Link to="/help" className="btn btn-outline">
              Visit the help centre
            </Link>
            <a href={`tel:${BRAND.phoneHref}`} className="btn btn-primary">
              <Icon name="phone" size={16} /> {BRAND.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <CtaBand />
    </div>
  );
}
