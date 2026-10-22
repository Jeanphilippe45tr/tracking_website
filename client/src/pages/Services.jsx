// -------------------------------------------------------------------
// Services — the full catalogue of what SwiftTrack offers.
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import CtaBand from "../components/CtaBand";
import Icon from "../components/Icon";
import { IMAGES, SERVICES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

// Extra detail shown for each service on this page.
const DETAILS = {
  express: {
    headline: "Delivered tomorrow, in the city and around it",
    text: "Our express network runs dedicated vehicles on the main corridors. Anything handed over before 4pm is on the delivery van of the next working day.",
    facts: [
      ["Cut-off time", "16:00 for next-day delivery"],
      ["Coverage", "Douala, Yaoundé, Bafoussam, Bamenda, Kribi"],
      ["Proof of delivery", "Signature or photo of the recipient"],
      ["Best for", "Documents, samples, forgotten parcels"],
    ],
  },
  international: {
    headline: "From Cameroon to the world, duties included",
    text: "We fly and sail your parcel through our own gateways. Customs paperwork is prepared by our team, so your parcel leaves the country without a question.",
    facts: [
      ["Transit time", "5 to 10 working days"],
      ["Destinations", "France, Europe, Gulf, Asia, West Africa"],
      ["Customs", "DDP — duties and taxes included in the rate"],
      ["Best for", "Sending stock, samples and gifts abroad"],
    ],
  },
  relay: {
    headline: "A pickup point in almost every neighbourhood",
    text: "Instead of waiting at home, your customer can collect the parcel at a supermarket, a pharmacy or a post office near them. Free for both sender and recipient.",
    facts: [
      ["Network", "2 400+ partner points"],
      ["Opening hours", "Most open 7 days, some until 21:00"],
      ["Payment on collection", "Cash, mobile money or card"],
      ["Best for", "Recipients who are not at home"],
    ],
  },
  freight: {
    headline: "Pallets, crates and containers",
    text: "Our freight desk moves commercial consignments by road, sea and air, with cargo insurance and loading equipment included.",
    facts: [
      ["Weight", "Up to 26 tonnes per pallet"],
      ["Modes", "Road, sea and air freight"],
      ["Handling", "Loading, unloading and lashing"],
      ["Best for", "Wholesale, industrial and relocation"],
    ],
  },
  ecommerce: {
    headline: "Fulfilment for online shops",
    text: "Send us your orders and we pick, pack, label and dispatch them every working day, then push the tracking number back into your shop automatically.",
    facts: [
      ["Cut-off", "Same-day dispatch before 15:00"],
      ["Returns", "Pick-up from your customers, free for 30 days"],
      ["Integration", "REST API, CSV and webhook"],
      ["Best for", "Online shops sending 5+ parcels a day"],
    ],
  },
  fulfilment: {
    headline: "Your stock, our warehouse",
    text: "Store your goods in a secure hub in Douala or Yaoundé. We pick and pack orders while you concentrate on selling.",
    facts: [
      ["Storage", "Bonded and climate-controlled"],
      ["Picking", "Same day on stock received before 14:00"],
      ["Reporting", "Live stock levels and monthly statement"],
      ["Best for", "Importers and growing brands"],
    ],
  },
};

export default function Services() {
  return (
    <div className="page">
      <PageHero
        eyebrow="Our services"
        title="Every way to send a parcel"
        subtitle="Express, standard, international, freight, relay points and fulfilment — all followed by the same live tracking page."
        image={IMAGES.warehouse}
      />

      {/* ---------------- OVERVIEW GRID ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="At a glance"
            title="Six services, one tracking page"
            subtitle="Pick the one that matches your parcel — you can always mix them in a single shipment."
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
                  <Link to={`/services#${service.id}`} className="service-card-link">
                    See the details <Icon name="arrowRight" size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- DETAILED SECTIONS ---------------- */}
      {SERVICES.map((service, index) => {
        const detail = DETAILS[service.id];
        return (
          <section
            key={service.id}
            id={service.id}
            className={`section ${index % 2 === 1 ? "section-alt" : ""}`}
          >
            <div className="container service-detail">
              <div className="service-detail-media">
                <img src={service.image} alt="" loading="lazy" />
                <span className="service-detail-icon">
                  <Icon name={service.icon} size={26} />
                </span>
              </div>

              <div className="service-detail-body">
                <p className="section-eyebrow">
                  <Icon name={service.icon} size={15} /> {service.title}
                </p>
                <h2 className="service-detail-title">{detail.headline}</h2>
                <p className="service-detail-text">{detail.text}</p>

                <dl className="service-facts">
                  {detail.facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>

                <ul className="service-points service-points-wide">
                  {service.points.map((point) => (
                    <li key={point}>
                      <Icon name="check" size={15} /> {point}
                    </li>
                  ))}
                </ul>

                <div className="section-cta section-cta-left">
                  <Link to="/pricing" className="btn btn-primary">
                    See the rates
                  </Link>
                  <Link to="/contact" className="btn btn-outline">
                    Request a quote
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* ---------------- PROCESS ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="How a shipment travels"
            title="From your door to their door"
            subtitle="The same journey for every parcel, whatever the service."
          />

          <ol className="process-list">
            <li>
              <span className="process-step">1</span>
              <div>
                <h3>Collection</h3>
                <p>
                  Our courier collects the parcel at your address, or you drop it
                  off at any relay point. You receive the tracking number
                  immediately.
                </p>
              </div>
            </li>
            <li>
              <span className="process-step">2</span>
              <div>
                <h3>Sorting hub</h3>
                <p>
                  The parcel is scanned into our hub, measured and routed. From
                  here every movement appears on your tracking page.
                </p>
              </div>
            </li>
            <li>
              <span className="process-step">3</span>
              <div>
                <h3>Line haul</h3>
                <p>
                  Night road, air or sea freight depending on the destination
                  and the service you chose.
                </p>
              </div>
            </li>
            <li>
              <span className="process-step">4</span>
              <div>
                <h3>Customs (if needed)</h3>
                <p>
                  We prepare and clear the customs file so your parcel is
                  released without delay.
                </p>
              </div>
            </li>
            <li>
              <span className="process-step">5</span>
              <div>
                <h3>Last mile</h3>
                <p>
                  The parcel goes out for delivery to the address, or waits at
                  the relay point your recipient chose.
                </p>
              </div>
            </li>
            <li>
              <span className="process-step">6</span>
              <div>
                <h3>Proof of delivery</h3>
                <p>
                  A signature, a photo and the exact delivery time close the
                  file. The whole history stays on your tracking page.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <CtaBand
        title="Need a custom solution?"
        text="Pallets, temperature-sensitive goods, oversized parcels or a dedicated contract — tell us what you need."
        primary={{ label: "Request a quote", to: "/contact" }}
        secondary={{ label: "See our rates", to: "/pricing" }}
        image={IMAGES.port}
      />
    </div>
  );
}
