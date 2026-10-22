// -------------------------------------------------------------------
// Pricing — rate cards, zone prices and a simple price estimator.
// -------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import CtaBand from "../components/CtaBand";
import Icon from "../components/Icon";
import { IMAGES, RATE_CARDS, ZONE_PRICES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";
import "../styles/table.css";

// Rough price per kg above the first kilogram, per destination type.
const EXTRA_PER_KG = {
  national: 900,
  regional: 2200,
  international: 4800,
};

const DESTINATIONS = [
  { id: "national", label: "Another city in Cameroon" },
  { id: "regional", label: "Another West African country" },
  { id: "international", label: "Europe, Gulf or Asia" },
];

export default function Pricing() {
  const [weight, setWeight] = useState(1);
  const [destination, setDestination] = useState("national");
  const [service, setService] = useState("standard");

  // The estimate is calculated from the selected service and weight.
  const estimate = useMemo(() => {
    const base = { standard: 3500, express: 6500, international: 18000 }[service];
    const zone = EXTRA_PER_KG[destination];
    const extraKg = Math.max(0, Number(weight) - 1);
    const total = base + extraKg * zone;
    return {
      total: total.toLocaleString("fr-FR"),
      extraKg,
      days: { standard: "2 – 4 days", express: "next day", international: "5 – 10 days" }[service],
    };
  }, [weight, destination, service]);

  return (
    <div className="page">
      <PageHero
        eyebrow="Rates & pricing"
        title="Simple prices, no surprises"
        subtitle="Everything is insured and tracked as standard. What you see below is what you pay — customs duties included on international shipments."
        image={IMAGES.port}
      />

      {/* ---------------- RATE CARDS ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Our services"
            title="Three ways to ship"
            subtitle="All rates include tracking, insurance up to 500 000 FCFA and delivery notifications."
          />

          <div className="pricing-grid">
            {RATE_CARDS.map((card) => (
              <article
                key={card.id}
                className={`pricing-card card ${card.highlight ? "is-featured" : ""}`}
              >
                {card.highlight && (
                  <span className="pricing-badge">Most popular</span>
                )}
                <span className="pricing-icon">
                  <Icon name={card.icon} size={24} />
                </span>
                <h3>{card.name}</h3>
                <p className="pricing-best">{card.best}</p>

                <p className="pricing-price">
                  <strong>{card.price}</strong>
                  <span>{card.priceNote}</span>
                </p>
                <p className="pricing-eta">
                  <Icon name="clock" size={15} /> Delivery in {card.eta}
                </p>

                <ul className="pricing-features">
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <Icon name="check" size={15} /> {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className={`btn btn-block ${card.highlight ? "btn-primary" : "btn-outline"}`}
                >
                  Choose {card.name}
                </Link>
              </article>
            ))}
          </div>

          <p className="pricing-note">
            <Icon name="invoice" size={15} /> Prices are per parcel and exclude
            customs duties on DDU shipments. Business customers receive volume
            rates from 20 parcels a month.
          </p>
        </div>
      </section>

      {/* ---------------- ESTIMATOR ---------------- */}
      <section className="section section-alt">
        <div className="container estimator-layout">
          <div className="estimator-form card">
            <SectionHeading
              eyebrow="Estimator"
              title="Get an instant price"
              subtitle="Tell us the weight and where it is going — we show an indicative price straight away."
              align="left"
            />

            <div className="form-group">
              <label htmlFor="estimator-service">Service</label>
              <select
                id="estimator-service"
                className="form-input"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="standard">Standard — 2 to 4 days</option>
                <option value="express">Express — next working day</option>
                <option value="international">
                  International — 5 to 10 days
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estimator-destination">Destination</label>
              <select
                id="estimator-destination"
                className="form-input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {DESTINATIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estimator-weight">
                Weight — {weight} kg
              </label>
              <input
                id="estimator-weight"
                type="range"
                min="1"
                max="30"
                step="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="range-input"
              />
              <div className="range-scale">
                <span>1 kg</span>
                <span>30 kg</span>
              </div>
            </div>
          </div>

          <div className="estimator-result card">
            <p className="estimator-result-label">Indicative price</p>
            <p className="estimator-result-price">
              {estimate.total} <span>FCFA</span>
            </p>
            <ul className="estimator-result-list">
              <li>
                <Icon name="clock" size={15} /> Delivered in {estimate.days}
              </li>
              <li>
                <Icon name="shield" size={15} /> Insured up to 500 000 FCFA
              </li>
              <li>
                <Icon name="radar" size={15} /> Live tracking included
              </li>
              <li>
                <Icon name="invoice" size={15} /> VAT included
              </li>
            </ul>
            <Link to="/contact" className="btn btn-primary btn-block">
              Book this service
            </Link>
            <p className="estimator-disclaimer">
              This is an estimate. The final price is confirmed when the
              courier weighs and measures your parcel.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- ZONE TABLE ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Main routes"
            title="Famous routes and their prices"
            subtitle="A sample of the corridors we run every day."
          />

          <div className="table-scroll card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Service</th>
                  <th>Transit time</th>
                  <th>From</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ZONE_PRICES.map((row) => (
                  <tr key={row.zone}>
                    <td data-label="Route">
                      <strong>{row.zone}</strong>
                    </td>
                    <td data-label="Service">{row.service}</td>
                    <td data-label="Transit time">{row.transit}</td>
                    <td data-label="Price">
                      <span className="zone-price">{row.price}</span>
                    </td>
                    <td data-label="Action" className="cell-actions">
                      <Link
                        to="/contact"
                        className="btn btn-outline btn-sm"
                      >
                        Book
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pricing-extras">
            <div className="pricing-extra card">
              <span className="pricing-extra-icon">
                <Icon name="box" size={22} />
              </span>
              <h3>Additional services</h3>
              <ul>
                <li>
                  Saturday delivery — <strong>2 000 FCFA</strong>
                </li>
                <li>Signature on delivery — <strong>500 FCFA</strong></li>
                <li>Return to sender — <strong>1 500 FCFA</strong></li>
                <li>Extended insurance (per 1 000 000 FCFA) —{" "}
                  <strong>3 500 FCFA</strong></li>
              </ul>
            </div>

            <div className="pricing-extra card">
              <span className="pricing-extra-icon">
                <Icon name="invoice" size={22} />
              </span>
              <h3>Business accounts</h3>
              <p>
                From 20 parcels a month you get volume rates, a credit line, a
                dedicated account manager and free collection at your address.
              </p>
              <Link to="/contact" className="link-btn">
                Ask for a business quote →
              </Link>
            </div>

            <div className="pricing-extra card">
              <span className="pricing-extra-icon">
                <Icon name="chat" size={22} />
              </span>
              <h3>Payment methods</h3>
              <p>
                MTN Mobile Money, Orange Money, Visa, Mastercard, bank
                transfer, and cash on delivery in most relay points.
              </p>
              <Link to="/help" className="link-btn">
                Read the payment guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title="Ready to send?"
        text="Book a collection or drop your parcel at the nearest relay point — we take it from there."
        primary={{ label: "Track a parcel", to: "/track" }}
        secondary={{ label: "Find a relay point", to: "/relay-points" }}
        image={IMAGES.warehouse}
      />
    </div>
  );
}
