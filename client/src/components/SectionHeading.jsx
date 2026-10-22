// -------------------------------------------------------------------
// SectionHeading — title + subtitle used at the top of every section.
// -------------------------------------------------------------------

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  light = false,
}) {
  return (
    <div className={`section-heading align-${align} ${light ? "light" : ""}`}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
