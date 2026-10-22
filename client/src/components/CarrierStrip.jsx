// -------------------------------------------------------------------
// CarrierStrip — the row of carrier wordmarks partners trust.
// -------------------------------------------------------------------
// The logos are drawn with CSS (brand colours + wordmark) instead of
// shipping image files, so they always stay crisp.
// -------------------------------------------------------------------

import { CARRIERS } from "../data/site";
import "../styles/content.css";

export default function CarrierStrip({ title = "We track parcels for" }) {
  return (
    <section className="carrier-strip">
      <div className="container">
        <p className="carrier-strip-title">{title}</p>
        <ul className="carrier-list">
          {CARRIERS.map((carrier) => (
            <li key={carrier.name}>
              <span
                className="carrier-mark"
                style={{ color: carrier.color, background: carrier.bg }}
              >
                {carrier.name}
              </span>
              <span className="carrier-tag">{carrier.tag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
