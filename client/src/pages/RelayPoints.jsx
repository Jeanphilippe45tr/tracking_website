// -------------------------------------------------------------------
// RelayPoints — find a pickup/relay point by city or postal code.
// -------------------------------------------------------------------
// The list is backed by a real interactive map (Leaflet + OpenStreetMap)
// so visitors can see where the points are in town.
// -------------------------------------------------------------------

import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRelayPoints } from "../api/shipments";
import Spinner from "../components/Spinner";
import MapView from "../components/MapView";
import Icon from "../components/Icon";
import { coordsFor, RELAY_COORDS } from "../data/geo";
import { IMAGES } from "../data/site";
import "../styles/pages.css";
import "../styles/content.css";

export default function RelayPoints() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await getRelayPoints(query);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Show everything when the input is empty (nice first impression).
  const handleShowAll = async () => {
    setQuery("");
    setLoading(true);
    setSearched(true);
    try {
      setResults(await getRelayPoints(""));
    } finally {
      setLoading(false);
    }
  };

  // Load the full list the first time the page opens.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getRelayPoints("");
        if (active) setResults(data);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Build the map markers from the results.
  const mapData = useMemo(() => {
    const points = results
      .map((point) => {
        const coords =
          (point.lat && point.lng && [point.lat, point.lng]) ||
          RELAY_COORDS[point.name] ||
          coordsFor(point.city);
        if (!coords) return null;
        return {
          lat: coords[0],
          lng: coords[1],
          title: point.name,
          subtitle: point.address,
          hours: point.hours,
          color: selected?.id === point.id ? "#0b2d5c" : "#f5821f",
        };
      })
      .filter(Boolean);

    const center = points.length ? [points[0].lat, points[0].lng] : undefined;
    return { points, center };
  }, [results, selected]);

  return (
    <div className="page">
      {/* ---------------- HEADER ---------------- */}
      <section
        className="page-hero compact"
        style={{ backgroundImage: `url(${IMAGES.relay})` }}
      >
        <div className="page-hero-overlay" />
        <div className="container page-hero-inner">
          <p className="page-hero-eyebrow">
            <Icon name="pin" size={15} /> 2,400 relay points
          </p>
          <h1 className="page-hero-title">Find a relay point</h1>
          <p className="page-hero-subtitle">
            Collect your parcel, drop off a return or pay on delivery at the
            partner shop closest to you. Search by city or postal code, then
            pick a point on the map.
          </p>
        </div>
      </section>

      <div className="container">
        {/* ---------------- SEARCH ---------------- */}
        <div className="relay-search card">
          <form onSubmit={handleSearch}>
            <label htmlFor="relay-q">City or postal code</label>
            <div className="relay-search-row">
              <input
                id="relay-q"
                type="text"
                className="form-input"
                placeholder="e.g. New York, London or 10016"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Icon name="search" size={16} /> Search
              </button>
            </div>
            <button type="button" className="link-btn" onClick={handleShowAll}>
              Show all relay points
            </button>
          </form>

          <ul className="relay-quick">
            {["New York", "London", "Paris", "Berlin", "Singapore"].map((city) => (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(city);
                  }}
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------------- MAP + LIST ---------------- */}
        <div className="relay-layout">
          <div className="relay-left">
            <div className="relay-map card">
              <MapView
                points={mapData.points}
                center={mapData.center}
                zoom={5}
                height={420}
                emptyText="No relay point to display."
              />
            </div>
            <p className="relay-map-note">
              <Icon name="map" size={14} /> Drag the map to explore. Click a
              marker to see the address and opening hours.
            </p>
          </div>

          <div className="relay-right">
            {loading && <Spinner label="Searching relay points..." />}

            {!loading && searched && results.length === 0 && (
              <div className="empty-state card">
                <p>No relay points found for “{query}”.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleShowAll}
                >
                  Show all relay points
                </button>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <p className="relay-count">
                  <Icon name="check" size={14} /> {results.length} relay point
                  {results.length > 1 ? "s" : ""} found
                </p>
                <ul className="relay-list">
                  {results.map((point) => (
                    <li
                      key={point.id}
                      className={`relay-item card ${
                        selected?.id === point.id ? "is-selected" : ""
                      }`}
                      onClick={() => setSelected(point)}
                    >
                      <div className="relay-item-head">
                        <h3>{point.name}</h3>
                        <span className="relay-distance">{point.distance} km</span>
                      </div>
                      <p className="relay-address">
                        <Icon name="pin" size={14} /> {point.address}
                      </p>
                      <p className="relay-hours">
                        <Icon name="clock" size={14} /> {point.hours}
                      </p>
                      <p className="relay-services">
                        <span>Drop-off</span>
                        <span>Collection</span>
                        <span>Cash on delivery</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!loading && !searched && (
              <div className="empty-state card">
                <p>Loading the network…</p>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- BENEFITS ---------------- */}
        <section className="relay-benefits">
          <div className="relay-benefit card">
            <span className="relay-benefit-icon">
              <Icon name="clock" size={22} />
            </span>
            <h3>Open late and on Saturdays</h3>
            <p>
              Most points welcome you until 19:00 or 21:00, and around half of
              them are open on Sunday.
            </p>
          </div>
          <div className="relay-benefit card">
            <span className="relay-benefit-icon">
              <Icon name="invoice" size={22} />
            </span>
            <h3>Pay however you like</h3>
            <p>
              Cash, card or contactless when you collect your parcel.
            </p>
          </div>
          <div className="relay-benefit card">
            <span className="relay-benefit-icon">
              <Icon name="shield" size={22} />
            </span>
            <h3>Free for 10 days</h3>
            <p>
              Your parcel waits at the point for ten days, then goes back to
              the sender.
            </p>
          </div>
        </section>

        <div className="section-cta">
          <Link to="/track" className="btn btn-primary">
            <Icon name="parcel" size={17} /> Track a parcel
          </Link>
          <Link to="/services#relay" className="btn btn-outline">
            How relay points work
          </Link>
        </div>
      </div>
    </div>
  );
}
