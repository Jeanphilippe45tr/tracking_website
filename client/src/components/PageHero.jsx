// -------------------------------------------------------------------
// PageHero — the banner every inner page starts with.
// -------------------------------------------------------------------
// It takes a background photo, a dark overlay and the page title so all
// inner pages look consistent (and photographic).
// -------------------------------------------------------------------

import Icon from "./Icon";
import "../styles/content.css";

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  children,
  compact = false,
}) {
  return (
    <section
      className={`page-hero ${compact ? "compact" : ""}`}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <div className="page-hero-overlay" />
      <div className="container page-hero-inner">
        {eyebrow && (
          <p className="page-hero-eyebrow">
            <Icon name="parcel" size={15} />
            {eyebrow}
          </p>
        )}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
