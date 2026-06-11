/**
 * Discover — RESONANCE × KEEPITIL
 *
 * Updated per Phase 4 directive:
 * · KEEPITIL-style hero with Bebas Neue display headline + gold/pink gradient
 * · Dual-event toggle: "All Events" (native + external) vs "RESONANCE Only"
 * · Source badges on external event cards
 * · Native events → RESONANCE checkout; External events → redirect to source
 */

import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { eventsAPI } from '../utils/api';
import EventCard from '../components/EventCard/EventCard';
import './Discover.css';

const GENRES = [
  'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep',
  'Hardstyle', 'Deep House', 'Tech House', 'Progressive House',
  'Psytrance', 'Future Bass', 'Trap',
];
const CITIES = [
  'Los Angeles', 'San Francisco', 'San Diego',
  'Oakland', 'Sacramento', 'Long Beach', 'Anaheim', 'Orange County',
];
const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'club_night', label: 'Club Night' },
  { value: 'festival', label: 'Festival' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'boat_party', label: 'Boat Party' },
];

export default function Discover() {
  const [filters, setFilters]       = useState({ genre: '', city: '', eventType: '', q: '' });
  const [activeGenre, setActiveGenre] = useState('');
  // Toggle: 'all' = native + external | 'resonance' = native only
  const [showMode, setShowMode]     = useState('all');

  const setFilter = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  // Native RESONANCE events
  const { data: nativeData, isLoading: nativeLoading } = useQuery({
    queryKey: ['events', filters, activeGenre],
    queryFn: () =>
      eventsAPI.getAll({ ...filters, genre: activeGenre || filters.genre, status: 'published' })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  // External aggregated events (Phase 3 new endpoint)
  const { data: externalData, isLoading: externalLoading } = useQuery({
    queryKey: ['external-events', filters, activeGenre],
    queryFn: () =>
      eventsAPI.getExternal({ ...filters, genre: activeGenre || filters.genre })
        .then((r) => r.data)
        .catch(() => ({ data: [] })),   // graceful: backend may not exist yet
    placeholderData: keepPreviousData,
    enabled: showMode === 'all',
  });

  const nativeEvents   = (nativeData?.data || []).map((e) => ({ ...e, _source: 'resonance' }));
  const externalEvents = (externalData?.data || []).map((e) => ({ ...e, _source: e.source || 'external' }));

  const displayEvents = showMode === 'resonance'
    ? nativeEvents
    : [...nativeEvents, ...externalEvents];

  const isLoading = nativeLoading || (showMode === 'all' && externalLoading);
  const totalCount = displayEvents.length;

  return (
    <div className="discover-page">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="discover-hero">
        <div className="discover-hero__content">
          <div className="discover-hero__eyebrow">
            <strong>◈ KEEPITIL</strong> &nbsp;PRESENTS
          </div>

          {/* Big Bebas Neue display title — matches flyer 1 */}
          <h1 className="discover-hero__title">FIND YOUR</h1>
          <span className="discover-hero__title-alt">FREQUENCY</span>

          <p className="discover-hero__sub">
            California EDM Events &nbsp;·&nbsp;
            <span>DJ Booking</span> &nbsp;·&nbsp; 18+
          </p>

          {/* Search */}
          <div className="discover-search">
            <input
              className="input discover-search__input"
              placeholder="Search events, venues, DJs..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
            <div className="discover-search__filters">
              <select
                className="input"
                value={filters.city}
                onChange={(e) => setFilter('city', e.target.value)}
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                className="input"
                value={filters.eventType}
                onChange={(e) => setFilter('eventType', e.target.value)}
              >
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Native vs All toggle */}
          <div className="discover-toggle">
            <button
              className={`discover-toggle__btn${showMode === 'all' ? ' active' : ''}`}
              onClick={() => setShowMode('all')}
            >All Events</button>
            <div className="discover-toggle__sep" />
            <button
              className={`discover-toggle__btn${showMode === 'resonance' ? ' active' : ''}`}
              onClick={() => setShowMode('resonance')}
            >◈ RESONANCE Only</button>
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* Genre filter pills */}
        <div className="genre-filter-bar">
          <button
            className={`genre-filter-pill${activeGenre === '' ? ' active' : ''}`}
            onClick={() => setActiveGenre('')}
          >All</button>
          {GENRES.map((g) => (
            <button
              key={g}
              className={`genre-filter-pill${activeGenre === g ? ' active' : ''}`}
              onClick={() => setActiveGenre(activeGenre === g ? '' : g)}
            >{g}</button>
          ))}
        </div>

        {/* Results */}
        <div className="discover-results">
          {isLoading ? (
            <div className="spinner" />
          ) : displayEvents.length === 0 ? (
            <div className="discover-empty">
              <div className="discover-empty__icon">◈</div>
              <h3>No events found</h3>
              <p>Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <>
              <div className="discover-results__header">
                <span className="discover-results__count">
                  <strong>{totalCount}</strong> upcoming events
                </span>
                {showMode === 'all' && externalEvents.length > 0 && (
                  <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-muted)' }}>
                    includes {externalEvents.length} external events
                  </span>
                )}
              </div>
              <div className="grid-3">
                {displayEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
