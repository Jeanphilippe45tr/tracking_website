// -------------------------------------------------------------------
// Testimonials — customer reviews with star ratings.
// -------------------------------------------------------------------

import Icon from "./Icon";
import { TESTIMONIALS } from "../data/site";
import "../styles/content.css";

export default function Testimonials({ items = TESTIMONIALS }) {
  return (
    <ul className="testimonial-grid">
      {items.map((item) => (
        <li key={item.name} className="testimonial-card">
          <div className="testimonial-stars" aria-label={`${item.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Icon
                key={index}
                name="star"
                size={16}
                className={index < item.rating ? "star-on" : "star-off"}
              />
            ))}
          </div>

          <p className="testimonial-text">“{item.text}”</p>

          <div className="testimonial-author">
            <img
              src={item.avatar}
              alt=""
              width="44"
              height="44"
              loading="lazy"
              className="testimonial-avatar"
            />
            <span>
              <strong>{item.name}</strong>
              <small>
                <Icon name="pin" size={12} /> {item.role}
              </small>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
