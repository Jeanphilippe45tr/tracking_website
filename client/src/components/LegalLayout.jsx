// -------------------------------------------------------------------
// LegalLayout — shared shell for the legal pages (terms, privacy).
// -------------------------------------------------------------------

import PageHero from "./PageHero";
import Icon from "./Icon";
import { IMAGES } from "../data/site";
import "../styles/content.css";
import "../styles/pages.css";

export default function LegalLayout({
  eyebrow,
  title,
  subtitle,
  updated,
  image = IMAGES.meeting,
  sections = [],
}) {
  return (
    <div className="page">
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} image={image} compact />

      <section className="section">
        <div className="container legal-layout">
          {/* ---------------- Table of contents ---------------- */}
          <aside className="legal-toc">
            <p className="legal-toc-title">On this page</p>
            <ul>
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#legal-${index + 1}`}>
                    <Icon name="chevronRight" size={14} />
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="legal-updated">
              <Icon name="calendar" size={14} /> Last updated: {updated}
            </p>
          </aside>

          {/* ---------------- Content ---------------- */}
          <div className="legal-content">
            {sections.map((section, index) => (
              <section key={section.title} id={`legal-${index + 1}`}>
                <h2>
                  <span className="legal-number">{index + 1}</span>
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
