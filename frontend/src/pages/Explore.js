/**
 * Explore — RESONANCE
 *
 * Updated per Phase 4 directive:
 * · Map now shows EXTERNAL aggregated events only (Eventbrite, Posh, EDM Train, etc.)
 * · Sidebar lists the same events with source badges
 * · Clicking map pin or list item shows popup with "View on [Platform]" CTA
 * · Filters: genre, city, source platform
 * · Click-through tracked before redirecting
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { externalEventsAPI } from '../utils/api';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import './Explore.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Source platform colors for neon markers
const SOURCE_COLORS = {
  eventbrite:   '#F05537',
  posh:         '#7B2FBE',
  edm_train:    '#1DB954',
  ticketmaster: '#026CDF',
  ra:           '#EE1C1C',
  dice:         '#FA1E4E',
  other:        '#888888',
};

const SOURCE_NAMES = {
  eventbrite: 'Eventbrite', posh: 'Posh', edm_train: 'EDM Train',
  ticketmaster: 'Ticketmaster', ra: 'RA', dice: 'DICE', other: 'External',
};

const createNeonMarker = (color = '#FF0077', selected = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${selected ? 18 : 13}px;
    height:${selected ? 18 : 13}px;
    background:${color};
    border:2px solid #fff;
    border-radius:50%;
    box-shadow:0 0 14px ${color}, 0 0 28px ${color}55;
    transition:all .2s;
  "></div>`,
  iconSize: [selected ? 18 : 13, selected ? 18 : 13],
  iconAnchor: [selected ? 9 : 6, selected ? 9 : 6],
});

const CA_CENTER = [36.7783, -119.4179];
const CA_BOUNDS = [[32.5, -124.5], [42.0, -114.1]];

const GENRES = ['House','Techno','Trance','Drum & Bass','Dubstep','Hardstyle','Deep House','Tech House','Future Bass','Psytrance'];
const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'eventbrite',   label: 'Eventbrite' },
  { value: 'posh',         label: 'Posh' },
  { value: 'edm_train',    label: 'EDM Train' },
  { value: 'ticketmaster', label: 'Ticketmaster' },
  { value: 'ra',           label: 'RA' },
  { value: 'dice',         label: 'DICE' },
];

function FitBounds({ events }) {
  const map = useMap();
  useEffect(() => {
    if (!events.length) { map.fitBounds(CA_BOUNDS); return; }
    const coords = events.filter((e) => e.lat && e.lng).map((e) => [e.lat, e.lng]);
    if (coords.length) map.fitBounds(L.latLngBounds(coords).pad(0.1));
  }, [events, map]);
  return null;
}

export default function Explore() {
  const [selected, setSelected]   = useState(null);
  const [genre, setGenre]         = useState('');
  const [source, setSource]       = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['external-events-map', genre, source],
    queryFn: () =>
      externalEventsAPI.getMap({ genre: genre || undefined, source: source || undefined })
        .then((r) => r.data),
  });

  const events = data?.data || [];
  const mapEvents = events.filter((e) => e.lat && e.lng);

  function handleRedirect(event) {
    externalEventsAPI.trackClick(event._id).catch(() => {});
    window.open(event.externalTicketLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="explore-page">
      {/* Sidebar */}
      <div className="explore-sidebar">
        <div className="explore-sidebar__header">
          <h2 className="explore-sidebar__title">◈ EXPLORE CALIFORNIA</h2>
          <p className="explore-sidebar__sub">{events.length} events from all platforms</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All Genres</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="explore-event-list">
          {isLoading ? (
            <div className="spinner" style={{ marginTop: 40 }} />
          ) : events.length === 0 ? (
            <div className="explore-empty">
              <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>◈</div>
              No events found — admins can add events via the curation panel
            </div>
          ) : events.map((event) => {
            const srcColor = SOURCE_COLORS[event.source] || '#888';
            const srcName  = SOURCE_NAMES[event.source]  || 'External';
            return (
              <button
                key={event._id}
                className={`explore-event-item${selected?._id === event._id ? ' active' : ''}`}
                onClick={() => setSelected(event)}
              >
                {event.posterImage && (
                  <img src={event.posterImage} alt={event.title} className="explore-event-item__img" />
                )}
                <div className="explore-event-item__info">
                  <div className="explore-event-item__date text-cyan">
                    {event.startDate ? format(new Date(event.startDate), 'EEE MMM d') : ''}
                  </div>
                  <div className="explore-event-item__title">{event.title}</div>
                  {event.artist && (
                    <div style={{ fontSize: 10, color: 'var(--magenta)', letterSpacing: 1, marginTop: 2 }}>{event.artist}</div>
                  )}
                  <div className="explore-event-item__venue text-dim">
                    📍 {event.venueName}, {event.city}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                    {(event.genres || []).slice(0, 1).map((g) => (
                      <span key={g} className="genre-pill" style={{ fontSize: 8 }}>{g}</span>
                    ))}
                    {/* Source badge */}
                    <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, border: `1px solid ${srcColor}`, color: srcColor, letterSpacing: 1, fontFamily: 'var(--font-body)' }}>
                      {srcName}
                    </span>
                  </div>
                </div>
                <div className="explore-event-item__price" style={{ color: 'var(--cyan)', fontSize: 11 }}>
                  {event.priceDisplay || ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="explore-map">
        <MapContainer center={CA_CENTER} zoom={6} style={{ width: '100%', height: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <FitBounds events={mapEvents} />

          {mapEvents.map((event) => {
            const markerColor = SOURCE_COLORS[event.source] || '#FF0077';
            const isSelected  = selected?._id === event._id;
            return (
              <Marker
                key={event._id}
                position={[event.lat, event.lng]}
                icon={createNeonMarker(markerColor, isSelected)}
                eventHandlers={{ click: () => setSelected(event) }}
              >
                <Popup className="rsn-popup">
                  <div className="map-popup">
                    {event.posterImage && (
                      <img src={event.posterImage} alt={event.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
                    )}
                    <div className="map-popup__body">
                      {/* Source badge */}
                      <div style={{ fontSize: 8, letterSpacing: 2, color: SOURCE_COLORS[event.source] || '#888', marginBottom: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
                        {SOURCE_NAMES[event.source] || 'External'}
                      </div>
                      {event.startDate && (
                        <div className="map-popup__date">{format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}</div>
                      )}
                      <div className="map-popup__title">{event.title}</div>
                      {event.artist && (
                        <div style={{ fontSize: 11, color: 'var(--magenta)', letterSpacing: 1, marginTop: 2 }}>{event.artist}</div>
                      )}
                      <div className="map-popup__venue">📍 {event.venueName}, {event.city}</div>
                      {event.priceDisplay && (
                        <div style={{ fontSize: 12, color: 'var(--cyan)', margin: '4px 0', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{event.priceDisplay}</div>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                        onClick={() => handleRedirect(event)}
                      >
                        View on {SOURCE_NAMES[event.source] || 'Platform'} →
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
