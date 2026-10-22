// -------------------------------------------------------------------
// CtaBand — the big call-to-action strip at the bottom of a page.
// -------------------------------------------------------------------

import { Link } from "react-router-dom";
import Icon from "./Icon";
import { IMAGES } from "../data/site";
import "../styles/content.css";

export default function CtaBand({
  title = "Ready to track your parcel?",
  text = "Enter your tracking number and see exactly where your parcel is right now — no account needed.",
  primary = { label: "Track a parcel", to: "/track" },
  secondary = { label: "Find a relay point", to: "/relay-points" },
  image = IMAGES.fleet,
}) {
  return (
    <section className="cta-band" style={{ backgroundImage: `url(${image})` }}>
      <div className="cta-band-overlay" />
      <div className="container cta-band-inner">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="section-cta">
          <Link to={primary.to} className="btn btn-primary btn-lg">
            <Icon name="parcel" size={18} />
            {primary.label}
          </Link>
          <Link to={secondary.to} className="btn btn-ghost btn-lg">
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
