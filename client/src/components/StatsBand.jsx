// -------------------------------------------------------------------
// StatsBand — the big numbers band (parcels, countries, relay points).
// -------------------------------------------------------------------

import Icon from "./Icon";
import { STATS } from "../data/site";
import "../styles/content.css";

export default function StatsBand({ image }) {
  return (
    <section
      className="stats-band"
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className="stats-band-overlay" />
      <div className="container stats-band-inner">
        <ul className="stats-list">
          {STATS.map((stat) => (
            <li key={stat.label}>
              <span className="stats-value">{stat.value}</span>
              <span className="stats-label">{stat.label}</span>
              <span className="stats-hint">
                <Icon name="check" size={13} /> {stat.hint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
