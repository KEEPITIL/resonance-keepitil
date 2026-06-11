import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { djsAPI } from '../utils/api';
import DJCard from '../components/DJCard/DJCard';
import './DJMarketplace.css';

const GENRES = ['House','Techno','Trance','Drum & Bass','Dubstep','Hardstyle','Deep House','Tech House','Progressive House','Psytrance','Future Bass','Melodic Techno'];

export default function DJMarketplace() {
  const [filters, setFilters] = useState({ genre: '', city: '', q: '', featured: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['djs', filters],
    queryFn: () => djsAPI.getAll(filters).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const djs = data?.data || [];
  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <div className="dj-marketplace">
      {/* Header */}
      <div className="dj-marketplace__hero">
        <div className="page-container">
          <div className="dj-hero-label">◈ DJ MARKETPLACE</div>
          <h1 className="dj-hero-title">FIND YOUR HEADLINER</h1>
          <p className="text-dim" style={{ letterSpacing: 2, fontSize: 13 }}>Book California's top EDM talent directly through RESONANCE</p>
        </div>
      </div>

      <div className="page-container">
        {/* Filters */}
        <div className="dj-filters">
          <input className="input" placeholder="Search DJs..." value={filters.q} onChange={(e) => set('q', e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="input" value={filters.genre} onChange={(e) => set('genre', e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Genres</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="input" value={filters.city} onChange={(e) => set('city', e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Cities</option>
            {['Los Angeles', 'San Francisco', 'San Diego', 'Oakland', 'Sacramento'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="featured-toggle">
            <input type="checkbox" checked={filters.featured === 'true'} onChange={(e) => set('featured', e.target.checked ? 'true' : '')} />
            Featured only
          </label>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="spinner" />
        ) : djs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎧</div>
            <p>No DJs found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="dj-results-header">
              <span className="text-dim">{data?.total || 0} DJs available</span>
            </div>
            <div className="grid-4">
              {djs.map((dj) => <DJCard key={dj._id} dj={dj} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
