import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './CreateEvent.css';

const GENRES = ['House','Techno','Trance','Drum & Bass','Dubstep','EDM','Hardstyle','Deep House','Tech House','Progressive House','Psytrance','Future Bass'];
const EVENT_TYPES = ['club_night','festival','warehouse','rooftop','outdoor','boat_party','private','other'];

const defaultTier = { name: '', price: 0, quantity: 100, description: '' };

export default function CreateEvent() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Details');
  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '',
    startDate: '', endDate: '', doorsOpen: '',
    venue: { name: '', address: '', city: 'Los Angeles', zip: '', lat: '', lng: '', capacity: '', ageRestriction: 18 },
    genres: [], eventType: 'club_night',
    isFree: false,
    ticketTiers: [{ ...defaultTier, name: 'General Admission' }],
    tags: '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setVenue = (k, v) => setForm((p) => ({ ...p, venue: { ...p.venue, [k]: v } }));
  const toggleGenre = (g) => set('genres', form.genres.includes(g) ? form.genres.filter((x) => x !== g) : [...form.genres, g]);

  const addTier = () => set('ticketTiers', [...form.ticketTiers, { ...defaultTier }]);
  const updateTier = (i, k, v) => { const t = [...form.ticketTiers]; t[i] = { ...t[i], [k]: v }; set('ticketTiers', t); };
  const removeTier = (i) => set('ticketTiers', form.ticketTiers.filter((_, idx) => idx !== i));

  const mutation = useMutation({
    mutationFn: (data) => eventsAPI.create(data),
    onSuccess: (res) => {
      toast.success('Event created!');
      qc.invalidateQueries(['my-events']);
      navigate('/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Creation failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
      venue: { ...form.venue, lat: form.venue.lat ? Number(form.venue.lat) : undefined, lng: form.venue.lng ? Number(form.venue.lng) : undefined, capacity: form.venue.capacity ? Number(form.venue.capacity) : undefined },
      ticketTiers: form.ticketTiers.map((t) => ({ ...t, price: Number(t.price), quantity: Number(t.quantity) })),
    };
    mutation.mutate(payload);
  };

  return (
    <div className="create-event page-container">
      <div className="create-event__header">
        <h1 style={{ fontFamily: 'var(--font-head)', letterSpacing: 3 }}>CREATE EVENT</h1>
        <p className="text-dim">Fill in your event details to get started</p>
      </div>

      <div className="dj-editor__tabs">
        {['Details','Venue','Tickets','Media'].map((tab) => (
          <button key={tab} className={`editor-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
        {activeTab === 'Details' && (
          <div className="editor-panel">
            <div className="form-group"><label className="form-label">Event Title *</label><input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. FREQUENCY: Techno Night" /></div>
            <div className="form-group"><label className="form-label">Short Description</label><textarea className="input" rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} maxLength={300} /></div>
            <div className="form-group"><label className="form-label">Full Description</label><textarea className="input" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Start Date & Time *</label><input className="input" type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">End Date & Time *</label><input className="input" type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required /></div>
            </div>
            <div className="form-group"><label className="form-label">Doors Open</label><input className="input" type="datetime-local" value={form.doorsOpen} onChange={(e) => set('doorsOpen', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Event Type</label>
              <select className="input" value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Genres</label>
              <div className="genre-picker">
                {GENRES.map((g) => <button key={g} type="button" className={`genre-pick-btn${form.genres.includes(g) ? ' active' : ''}`} style={form.genres.includes(g) ? { background: 'var(--magenta)', borderColor: 'var(--magenta)' } : {}} onClick={() => toggleGenre(g)}>{g}</button>)}
              </div>
            </div>
            <div className="form-group"><label className="form-label">Tags (comma-separated)</label><input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g. underground, late night, free" /></div>
          </div>
        )}

        {activeTab === 'Venue' && (
          <div className="editor-panel">
            <div className="form-group"><label className="form-label">Venue Name *</label><input className="input" value={form.venue.name} onChange={(e) => setVenue('name', e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Address</label><input className="input" value={form.venue.address} onChange={(e) => setVenue('address', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">City *</label>
                <select className="input" value={form.venue.city} onChange={(e) => setVenue('city', e.target.value)}>
                  {['Los Angeles','San Francisco','San Diego','Oakland','Sacramento','Long Beach','Anaheim','Riverside'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">ZIP Code</label><input className="input" value={form.venue.zip} onChange={(e) => setVenue('zip', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Latitude (for map)</label><input className="input" type="number" step="any" value={form.venue.lat} onChange={(e) => setVenue('lat', e.target.value)} placeholder="e.g. 34.0522" /></div>
              <div className="form-group"><label className="form-label">Longitude (for map)</label><input className="input" type="number" step="any" value={form.venue.lng} onChange={(e) => setVenue('lng', e.target.value)} placeholder="e.g. -118.2437" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Capacity</label><input className="input" type="number" value={form.venue.capacity} onChange={(e) => setVenue('capacity', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Age Restriction</label>
                <select className="input" value={form.venue.ageRestriction} onChange={(e) => setVenue('ageRestriction', Number(e.target.value))}>
                  <option value={18}>18+</option><option value={21}>21+</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tickets' && (
          <div className="editor-panel">
            <label className="publish-toggle" style={{ marginBottom: 20 }}>
              <input type="checkbox" checked={form.isFree} onChange={(e) => set('isFree', e.target.checked)} />
              <span>This is a free event</span>
            </label>
            {!form.isFree && (
              <>
                {form.ticketTiers.map((tier, i) => (
                  <div key={i} className="tier-editor card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 2 }}>TIER {i + 1}</span>
                      {i > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeTier(i)}>Remove</button>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group"><label className="form-label">Name</label><input className="input" value={tier.name} onChange={(e) => updateTier(i, 'name', e.target.value)} required /></div>
                      <div className="form-group"><label className="form-label">Price ($)</label><input className="input" type="number" min="0" step="0.01" value={tier.price} onChange={(e) => updateTier(i, 'price', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Quantity</label><input className="input" type="number" min="1" value={tier.quantity} onChange={(e) => updateTier(i, 'quantity', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Description (optional)</label><input className="input" value={tier.description} onChange={(e) => updateTier(i, 'description', e.target.value)} /></div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" style={{ borderColor: 'var(--magenta)', color: 'var(--magenta)' }} onClick={addTier}>+ Add Ticket Tier</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'Media' && (
          <div className="editor-panel">
            <p className="text-dim" style={{ fontSize: 13 }}>After creating the event, you can upload a cover image from your event dashboard.</p>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Promo Video URL (YouTube)</label>
              <input className="input" value={form.promoVideoUrl || ''} onChange={(e) => set('promoVideoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Event (Save as Draft)'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
