// -------------------------------------------------------------------
// Logo — the SwiftTrack brand mark (a parcel with speed lines).
// -------------------------------------------------------------------
// Drawn as inline SVG so it stays sharp and inherits the accent colour.
// -------------------------------------------------------------------

export default function Logo({ size = 34, showText = true, className = "" }) {
  return (
    <span className={`logo ${className}`}>
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        {/* speed lines */}
        <g className="logo-speed" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M4 20h9" />
          <path d="M2 27h8" />
          <path d="M6 34h6" />
        </g>
        {/* parcel */}
        <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
          <path d="M42 15 30 9.5 18 15v16l12 5.5L42 31V15Z" />
          <path d="M18 15l12 5.5L42 15" />
          <path d="M30 20.5v16" />
        </g>
      </svg>

      {showText && (
        <span className="logo-text">
          Swift<span>Track</span>
        </span>
      )}
    </span>
  );
}
