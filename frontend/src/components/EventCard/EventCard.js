/**
 * EventCard — RESONANCE × KEEPITIL
 *
 * Mini-flyer style card. Supports both native RESONANCE events and
 * external aggregated events (Eventbrite, Posh, EDM Train, Ticketmaster).
 *
 * · Native events  → React Router Link → RESONANCE checkout
 * · External events → <a target="_blank"> → source platform + click tracking
 * · Source badge shown bottom-left on external cards
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { externalEventsAPI } from '../../utils/api';
import './EventCard.css';

const SOURCE_LABELS = {
  resonance:    { label: '◈ RESONANCE', color: '#FF0077' },
  eventbrite:   { label: 'Eventbrite',  color: '#F05537' },
  posh:         { label: 'Posh',        color: '#7B2FBE' },
  edm_train:    { label: 'EDM Train',   color: '#1DB954' },
  ticketmaster: { label: 'Ticketmaster',color: '#026CDF' },
  ra:           { label: 'RA',          color: '#EE1C1C' },
  dice:         { label: 'DICE',        color: '#FA1E4E' },
  external:     { label: 'External',    color: '#888888' },
};

// ── Inner card layout (shared between native and external) ──────────────────
function CardInner({ cover, title, headlinerName, startDate, venueCity, genres, priceLabel, priceClass, sourceMeta, isFree, isSoldOut }) {
  return (
    <div className="event-card__cover">
      {cover ? (
        <img src={cover} alt={title} loading="lazy" className="event-card__img" />
      ) : (
        <div className="event-card__cover-placeholder">
          <span className="event-card__placeholder-logo">◈</span>
        </div>
      )}

      <div className="event-card__overlay" />

      {/* Top row: genre pill */}
      <div className="event-card__top-row">
        {(genres || []).slice(0, 1).map((g) => (
          <span key={g} className="event-card__genre">{g}</span>
        ))}
        <div className="event-card__badges">
          {isSoldOut && <span className="badge badge-sold">Sold Out</span>}
          {isFree && !isSoldOut && <span className="badge badge-free">Free</span>}
          <span className="badge badge-18">18+</span>
        </div>
      </div>

      {/* Price tag — top right */}
      <div className={`event-card__price ${priceClass}`}>{priceLabel}</div>

      {/* Bottom: flyer-style stacked text */}
      <div className="event-card__info">
        {headlinerName && (
          <p className="event-card__headliner">{headlinerName}</p>
        )}
        <h3 className="event-card__title">{title}</h3>
        <div className="event-card__meta">
          {startDate && (
            <>
              <span className="event-card__date">
                {format(new Date(startDate), 'EEE MMM d').toUpperCase()}
              </span>
              <span className="event-card__sep">·</span>
            </>
          )}
          {venueCity && (
            <span className="event-card__city">{venueCity.toUpperCase()}</span>
          )}
        </div>
        {/* Source badge — shown on external events */}
        {sourceMeta && sourceMeta.label !== '◈ RESONANCE' && (
          <div
            className="event-card__source-badge"
            style={{ '--source-color': sourceMeta.color }}
          >
            {sourceMeta.label}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EventCard({ event }) {
  const {
    _id, slug, title, coverImage, startDate, venue,
    genres = [], minPrice, isFree, status, lineup = [],
    // External fields
    _source, externalTicketLink, source,
    artist, venueName, city, posterImage, priceDisplay,
  } = event;

  const isExternal    = Boolean(_source && _source !== 'resonance');
  const isSoldOut     = status === 'sold_out';
  const headliner     = lineup.find?.((l) => l.isHeadliner);
  const headlinerName = artist || headliner?.djName || headliner?.dj?.stageName;
  const cover         = coverImage || posterImage;
  const venueCity     = venue?.city || city;

  const priceLabel = priceDisplay
    ? priceDisplay
    : isFree
    ? 'FREE'
    : isSoldOut
    ? 'SOLD OUT'
    : minPrice
    ? `$${Math.round(minPrice)}`
    : 'TIX';

  const priceClass = (isFree || priceDisplay === 'Free')
    ? 'event-card__price--free'
    : isSoldOut
    ? 'event-card__price--sold'
    : 'event-card__price--paid';

  const sourceMeta = SOURCE_LABELS[_source || source] || SOURCE_LABELS.external;

  function handleExternalClick() {
    if (isExternal && _id) {
      externalEventsAPI.trackClick(_id).catch(() => {});
    }
  }

  const innerProps = {
    cover, title, headlinerName, startDate, venueCity, genres,
    priceLabel, priceClass, sourceMeta, isFree, isSoldOut,
  };

  if (isExternal) {
    return (
      <a
        href={externalTicketLink}
        target="_blank"
        rel="noopener noreferrer"
        className="event-card event-card--external"
        onClick={handleExternalClick}
      >
        <CardInner {...innerProps} />
      </a>
    );
  }

  return (
    <Link to={`/events/${slug}`} className="event-card">
      <CardInner {...innerProps} />
    </Link>
  );
}
