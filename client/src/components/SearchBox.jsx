// -------------------------------------------------------------------
// SearchBox — reusable tracking-number input + "Track" button.
// -------------------------------------------------------------------
// Used on the Home hero. On submit it navigates to /track/:number.
// -------------------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/search.css";

export default function SearchBox({
  initialValue = "",
  placeholder = "Enter your tracking number",
  autoFocus = false,
  size = "large",
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmed = value.trim();

    // Simple front-end validation before navigating.
    if (!trimmed) {
      setError("Please enter a tracking number.");
      return;
    }
    if (trimmed.length < 6) {
      setError("That tracking number looks too short.");
      return;
    }

    setError("");
    navigate(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form className={`search-box search-${size}`} onSubmit={handleSubmit} noValidate>
      <label htmlFor="tracking-input" className="sr-only">
        Tracking number
      </label>
      <input
        id="tracking-input"
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "tracking-error" : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError("");
        }}
      />
      <button type="submit" className="btn btn-primary search-btn">
        Track
      </button>

      {error && (
        <p id="tracking-error" className="field-error search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
