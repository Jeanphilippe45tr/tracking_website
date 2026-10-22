// -------------------------------------------------------------------
// FaqList — accordion of questions and answers.
// -------------------------------------------------------------------
// Built on <details> so it works without any JavaScript.
// -------------------------------------------------------------------

export default function FaqList({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <div className={`faq-list ${className}`}>
      {items.map((item) => (
        <details key={item.q} className="faq-item card">
          <summary>
            <span>{item.q}</span>
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
