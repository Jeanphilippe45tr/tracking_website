// -------------------------------------------------------------------
// Help — the help centre: categories, FAQs and shipping guides.
// -------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import Icon from "../components/Icon";
import { FAQ_CATEGORIES, IMAGES } from "../data/site";
import { useBrand } from "../context/SettingsContext";
import "../styles/pages.css";
import "../styles/content.css";

// The quick guides shown at the top of the help centre.
const GUIDES = [
  {
    icon: "invoice",
    title: "How to read your tracking number",
    text: "Where to find it, what each part means and why it is always 12 characters long.",
    time: "2 min read",
    body: [
      "Every parcel gets a unique reference the moment a courier scans it. It always starts with TRK, followed by nine letters and digits — twelve characters in total.",
      "You will find it in your confirmation email and SMS, printed on your receipt, and in the SwiftTrack dashboard. If you sent the parcel for someone else, ask them to forward it to you: the reference is enough to follow the parcel from anywhere in the world.",
      "Numbers are not case sensitive, but they are not forgiving about typos. If a reference is rejected, check for a zero that looks like an O, and for a one that looks like an I.",
    ],
  },
  {
    icon: "globe",
    title: "Shipping to Europe: customs explained",
    text: "Documents, duties and the DDP option that means no surprise bills on delivery.",
    time: "5 min read",
    body: [
      "Every parcel entering the European Union needs a commercial invoice and proof of payment. The invoice lists the goods, their value, their weight and the country of origin — a photo of a receipt is enough for small gifts.",
      "Shipments over €150 in value may attract import VAT, and higher-value goods can face duty. DDP (duties and taxes paid) means we clear the file and pay the charges on your behalf, so the recipient is never asked to pay on the doorstep.",
      "Keep the invoice for at least three years. If the parcel is inspected, our team may ask for the original document.",
    ],
  },
  {
    icon: "pin",
    title: "Collecting at a relay point",
    text: "What to bring, how long we keep your parcel and how to pay on collection.",
    time: "3 min read",
    body: [
      "Bring the tracking reference and a piece of ID that matches the name on the parcel. If the parcel was sent to a company, add your business card.",
      "We hold a parcel for ten days at the relay point. After that it goes back to the hub, and a second storage fee applies.",
      "Payment on collection is accepted by card, contactless and, in selected regions, cash. We never ask for a transfer before handing the parcel over.",
    ],
  },
  {
    icon: "box",
    title: "Packing fragile and special items",
    text: "The rules for liquids, batteries, food and electronics — and free packaging.",
    time: "4 min read",
    body: [
      "Liquids travel sealed in a leak-proof bag with absorbent material. Aerosols and pressurised containers are accepted up to one litre and must have their protective caps on.",
      "Lithium batteries are only accepted in equipment or in a standalone battery pack with the terminals protected. Damaged or recalled batteries are refused.",
      "Perishable food is accepted for domestic shipments only, packed with ice or a cooling gel, and must be collected within 24 hours.",
    ],
  },
];

export default function Help() {
  const brand = useBrand();
  const [active, setActive] = useState(FAQ_CATEGORIES[0].id);
  const [query, setQuery] = useState("");

  const category = FAQ_CATEGORIES.find((item) => item.id === active);

  // Every question of every category, flattened, so the search bar can
  // look through the whole help centre at once.
  const allItems = useMemo(
    () =>
      FAQ_CATEGORIES.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, category: cat.title }))
      ),
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allItems.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const searching = query.trim().length >= 2;

  return (
    <div className="page">
      <PageHero
        eyebrow="Help centre"
        title="Answers, guides and a real human when you need one"
        subtitle="Everything you need to track, ship and collect a parcel with SwiftTrack."
        image={IMAGES.supermarket}
      />

      {/* ---------------- SEARCH ---------------- */}
      <section className="help-search-bar">
        <div className="container">
          <form
            className="help-search"
            onSubmit={(event) => event.preventDefault()}
            role="search"
          >
            <Icon name="search" size={20} />
            <input
              type="search"
              className="help-search-input"
              placeholder="Search the help centre — e.g. customs, relay point, invoice..."
              aria-label="Search the help centre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ---------------- GUIDES ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Guides"
            title="Popular guides"
            subtitle="Short, practical and written by the people who work in the hubs."
          />

          <div className="guide-grid">
            {GUIDES.map((guide) => (
              <details key={guide.title} className="guide-card card">
                <summary>
                  <span className="guide-icon">
                    <Icon name={guide.icon} size={22} />
                  </span>
                  <h3>{guide.title}</h3>
                </summary>
                <p className="guide-text">{guide.text}</p>
                <ul className="guide-body">
                  {guide.body.map((paragraph) => (
                    <li key={paragraph.slice(0, 24)}>{paragraph}</li>
                  ))}
                </ul>
                <span className="guide-time">
                  <Icon name="clock" size={13} /> {guide.time}
                </span>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FAQ CATEGORIES ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            subtitle="Pick a category — we have grouped the questions the way our support desk does."
          />

          <div className="help-categories">
            <ul className="help-category-list">
              {FAQ_CATEGORIES.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`help-category ${
                      active === item.id ? "active" : ""
                    }`}
                    onClick={() => setActive(item.id)}
                  >
                    <span className="help-category-icon">
                      <Icon name={item.icon} size={18} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.intro}</small>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="help-category-body card">
              {searching ? (
                <>
                  <h3>
                    {results.length} result{results.length === 1 ? "" : "s"} for
                    “{query.trim()}”
                  </h3>
                  <p className="help-category-intro">
                    These are the questions in the help centre that match your
                    search.
                  </p>

                  {results.length === 0 ? (
                    <div className="empty-state">
                      <Icon name="search" size={28} />
                      <p>
                        Nothing found. Try another word, or ask our team — we
                        answer in minutes.
                      </p>
                      <Link to="/contact" className="btn btn-outline">
                        Contact support
                      </Link>
                    </div>
                  ) : (
                    <div className="faq-list">
                      {results.map((item) => (
                        <details key={item.q} className="faq-item">
                          <summary>
                            <span>{item.q}</span>
                            <small className="faq-item-category">
                              {item.category}
                            </small>
                          </summary>
                          <p>{item.a}</p>
                        </details>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3>{category.title}</h3>
                  <p className="help-category-intro">{category.intro}</p>

                  <div className="faq-list">
                    {category.items.map((item) => (
                      <details key={item.q} className="faq-item">
                        <summary>
                          <span>{item.q}</span>
                        </summary>
                        <p>{item.a}</p>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section className="section">
        <div className="container">
          <div className="help-contact card">
            <div className="help-contact-text">
              <h2>Did not find your answer?</h2>
              <p>
                Our support team is open every day, from 08:00 to 20:00 ET. We
                answer in English, Spanish, French and German, usually within
                two minutes.
              </p>
              <ul>
                <li>
                  <Icon name="phone" size={15} /> {brand.phone}
                </li>
                <li>
                  <Icon name="mail" size={15} /> {brand.email}
                </li>
                <li>
                  <Icon name="chat" size={15} /> WhatsApp — {brand.whatsapp}
                </li>
              </ul>
            </div>
            <div className="help-contact-actions">
              <Link to="/contact" className="btn btn-primary btn-lg">
                Contact support
              </Link>
              <Link to="/relay-points" className="btn btn-outline btn-lg">
                Find a relay point
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
