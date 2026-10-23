// -------------------------------------------------------------------
// About — our story, values, timeline, hubs and team.
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SectionHeading from "../components/SectionHeading";
import CarrierStrip from "../components/CarrierStrip";
import CtaBand from "../components/CtaBand";
import Icon from "../components/Icon";
import { BRAND, IMAGES, MILESTONES, OFFICES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

const VALUES = [
  {
    icon: "radar",
    title: "Tell the truth",
    text: "We publish the scan we actually recorded, even when it says the parcel is stuck. No invented movements, no fake progress bars.",
  },
  {
    icon: "shield",
    title: "Own the whole journey",
    text: "From the moment we collect a parcel to the moment it is signed for, we are responsible for it. That is why our tracking is accurate.",
  },
  {
    icon: "headset",
    title: "Be reachable",
    text: "A parcel that is late is a parcel that worries someone. Our support team answers in under two minutes, every day of the week.",
  },
  {
    icon: "globe",
    title: "Think local first",
    text: "We started in Brooklyn. Every city we enter keeps its own routes, prices and opening hours — global reach with a local feel.",
  },
];

const TEAM = [
  {
    name: "Marcus Reed",
    role: "Founder & CEO",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    text: "Started SwiftTrack with one van in 2014. Still answers the support line every morning.",
  },
  {
    name: "Elena Rossi",
    role: "Head of Operations",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "Runs our 35 sorting hubs and makes sure a parcel never sleeps in a corner.",
  },
  {
    name: "Daniel Kim",
    role: "Head of Technology",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    text: "Built the tracking platform and the customer API used by more than 300 shops.",
  },
  {
    name: "Sofia Alvarez",
    role: "Customer Care Lead",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    text: "Leads our multilingual support team of 28 people in New York, London and Singapore.",
  },
];

export default function About() {
  return (
    <div className="page">
      <PageHero
        eyebrow="About us"
        title="We move parcels, and we tell you exactly where they are"
        subtitle="SwiftTrack started with one van in Brooklyn in 2014. Twelve years later we run 35 hubs, a network of 2,400 relay points and the tracking platform you are using right now."
        image={IMAGES.aboutUs}
      />

      {/* ---------------- STORY ---------------- */}
      <section className="section" id="story">
        <div className="container why-layout">
          <div className="why-media">
            <img
              src={IMAGES.aboutUs}
              alt="The SwiftTrack team at our New York hub"
              loading="lazy"
            />
            <div className="why-media-card">
              <span className="why-media-value">{BRAND.founded}</span>
              <span className="why-media-label">
                founded in Brooklyn,
                <br />
                still family owned
              </span>
            </div>
          </div>

          <div className="why-content">
            <SectionHeading
              eyebrow="Our story"
              title="It started with a phone book"
              subtitle="In 2014, Marcus delivered parcels between Brooklyn and Manhattan with a second-hand van and a notebook full of phone numbers. Customers kept asking the same question: “where is my parcel?”"
              align="left"
            />

            <p className="about-text">
              We built the first version of the tracking page the same year —
              a simple page that showed the last place a parcel had been seen.
              Twelve years later the page is used by more than 1.2 million parcels
              a year, but the promise has not changed: if we know where your
              parcel is, you can see it too.
            </p>

            <p className="about-text">
              Today SwiftTrack is an American company with offices in New York,
              London and Singapore. We still collect, sort and deliver every
              parcel ourselves, and we still answer the phone ourselves.
            </p>

            <Link to="/contact" className="btn btn-secondary">
              Talk to the team <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- VALUES ---------------- */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="What we stand for"
            title="Four rules we do not break"
            subtitle="They are printed on the wall of every hub and signed by the whole team."
          />

          <div className="value-grid">
            {VALUES.map((value) => (
              <article key={value.title} className="value-card card">
                <span className="value-icon">
                  <Icon name={value.icon} size={24} />
                </span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TIMELINE ---------------- */}
      <section className="section">
        <div className="container container-narrow">
          <SectionHeading
            eyebrow="Milestones"
            title="Twelve years, step by step"
            subtitle="The moments that changed the way we work."
          />

          <ol className="timeline-story">
            {MILESTONES.map((item) => (
              <li key={item.year} className="timeline-story-item">
                <span className="timeline-story-year">{item.year}</span>
                <div className="timeline-story-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- OFFICES ---------------- */}
      <section className="section section-alt" id="partners">
        <div className="container">
          <SectionHeading
            eyebrow="Where we are"
            title="Our offices and hubs"
            subtitle="Come and see us, or drop a parcel at the counter of any of our relay points."
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
                <a
                  className="office-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.map)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Get directions <Icon name="arrowRight" size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- TEAM ---------------- */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="The team"
            title="The people behind the parcels"
            subtitle="Small team, big obsession with the last mile."
          />

          <div className="team-grid">
            {TEAM.map((member) => (
              <article key={member.name} className="team-card card">
                <img src={member.avatar} alt="" loading="lazy" />
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-text">{member.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PARTNERS ---------------- */}
      <CarrierStrip title="We deliver together with the world's best carriers" />

      {/* ---------------- CAREERS ---------------- */}
      <section className="section" id="careers">
        <div className="container">
          <div className="careers-card">
            <div>
              <h2>Join the team</h2>
              <p>
                We are hiring couriers, hub operators and software engineers in
                New York, London and Singapore. A laptop, a phone and a good
                pair of shoes are all you need to start.
              </p>
            </div>
            <Link to="/contact" className="btn btn-primary btn-lg">
              See open positions
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Your parcel deserves a real tracking page"
        text="Follow it step by step, from the first scan to the signature on the door."
        primary={{ label: "Track a parcel", to: "/track" }}
        secondary={{ label: "Find a relay point", to: "/relay-points" }}
        image={IMAGES.port}
      />
    </div>
  );
}
