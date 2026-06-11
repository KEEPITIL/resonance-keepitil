/**
 * AdminExternalEvents — RESONANCE
 *
 * Admin-only panel for curating third-party events that appear on the
 * Discover page and Explore map. Admins manually copy event details from
 * Eventbrite, Posh, EDM Train, Ticketmaster, etc. and paste them here.
 *
 * Features:
 * · List all external events with click-through stats
 * · Create / edit / delete events
 * · Click-through analytics by source platform
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalEventsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SOURCES = [
  { value: 'eventbrite',   label: 'Eventbrite',   color: '#F05537' },
  { value: 'posh',         label: 'Posh',          color: '#7B2FBE' },
  { value: 'edm_train',    label: 'EDM Train',     color: '#1DB954' },
  { value: 'ticketmaster', label: 'Ticketmaster',  color: '#026CDF' },
  { value: 'ra',           label: 'Resident Advisor', color: '#EE1C1C' },
  { value: 'dice',         label: 'DICE',          color: '#FA1E4E' },
  { value: 'other',        label: 'Other',         color: '#888888' },
];

const GENRES = [
  'House','Techno','Trance','Drum & Bass','Dubstep','Hardstyle',
  'Deep House','Tech House','Progressive House','Psytrance','Future Bass',
  'Trap','Garage','Breaks','Industrial','Acid','Melodic Techno','Other',
];

const EVENT_TYPES = [
  'club_night','festival','warehouse','rooftop','outdoor','boat_party','concert','other'
];

const EMPTY_FORM = {
  title: '', artist: '', supportingActs: '', description: '',
  startDate: '', endDate: '', doorsOpen: '',
  venueName: '', address: '', city: '', state: 'CA', zip: '',
  lat: '', lng: '', ageRestriction: 18,
  genres: [], eventType: 'club_night',
  source: 'eventbrite', externalTicketLink: '',
  priceDisplay: '', posterImage: '', isFeatured: false, adminNotes: '',
};

export default function AdminExternalEvents() {
  const qc = useQueryClient();
  const [view, setView]           = useState('list');   // 'list' | 'form' | 'analytics'
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [genreInput, setGenreInput] = useState('');

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: listData, isLoading } = useQuery({
    queryKey: ['admin-external-events'],
    queryFn: () => externalEventsAPI.getAll({ limit: 100 }).then((r) => r.data),
    enabled: view === 'list',
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-external-analytics'],
    queryFn: () => externalEventsAPI.analytics().then((r) => r.data),
    enabled: view === 'analytics',
  });

  const events = listData?.data || [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => externalEventsAPI.create(data),
    onSuccess: () => { toast.success('Event created'); qc.invalidateQueries(['admin-external-events']); setView('list'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => externalEventsAPI.update(id, data),
    onSuccess: () => { toast.success('Event updated'); qc.invalidateQueries(['admin-external-events']); setView('list'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => externalEventsAPI.delete(id),
    onSuccess: () => { toast.success('Event deleted'); qc.invalidateQueries(['admin-external-events']); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Delete failed'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setView('form');
  }

  function openEdit(ev) {
    setForm({
      ...EMPTY_FORM,
      ...ev,
      startDate:    ev.startDate ? ev.startDate.slice(0, 16) : '',
      endDate:      ev.endDate   ? ev.endDate.slice(0, 16)   : '',
      doorsOpen:    ev.doorsOpen ? ev.doorsOpen.slice(0, 16) : '',
      supportingActs: (ev.supportingActs || []).join(', '),
    });
    setEditing(ev._id);
    setView('form');
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleGenre(g) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      supportingActs: form.supportingActs ? form.supportingActs.split(',').map((s) => s.trim()).filter(Boolean) : [],
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, letterSpacing: 3, color: 'var(--magenta)' }}>◈ EXTERNAL EVENTS</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 11, letterSpacing: 1, marginTop: 4 }}>Curate third-party events for Discover + Explore map</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['list','form','analytics'].map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === 'form') openCreate(); }}
              style={{ padding: '7px 16px', background: view === v ? 'var(--magenta)' : 'transparent', border: '1px solid ' + (view === v ? 'var(--magenta)' : 'var(--border)'), borderRadius: 4, color: view === v ? '#fff' : 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              {v === 'form' ? '+ Add Event' : v}
            </button>
          ))}
        </div>
      </div>

      {/* ── List view ───────────────────────────────────────────────────── */}
      {view === 'list' && (
        isLoading ? <div className="spinner" /> : (
          <div>
            <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
              {events.length} external events curated
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
                <p style={{ fontFamily: 'var(--font-head)', letterSpacing: 2 }}>No external events yet</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Click "+ Add Event" to curate events from Eventbrite, Posh, EDM Train, etc.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.map((ev) => {
                  const src = SOURCES.find((s) => s.value === ev.source);
                  return (
                    <div key={ev._id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      {ev.posterImage && (
                        <img src={ev.posterImage} alt={ev.title} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>{ev.title}</span>
                          {ev.isFeatured && <span style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', borderRadius: 3, color: 'var(--cyan)', letterSpacing: 1 }}>FEATURED</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
                          <span style={{ color: src?.color || '#888' }}>{src?.label || ev.source}</span>
                          <span>📍 {ev.city}, CA</span>
                          <span>🗓 {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : '—'}</span>
                          <span style={{ color: ev.clickThroughs > 0 ? 'var(--cyan)' : undefined }}>
                            {ev.clickThroughs} clicks
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => openEdit(ev)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}>Edit</button>
                        <button
                          onClick={() => { if (window.confirm('Delete this event?')) deleteMutation.mutate(ev._id); }}
                          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,102,0,0.3)', borderRadius: 4, color: 'var(--orange)', fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                        >Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ── Form view ───────────────────────────────────────────────────── */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 28, fontSize: 14 }}>
            {editing ? 'Edit External Event' : 'Add External Event'}
          </h3>

          <Section title="Source Platform">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SOURCES.map((s) => (
                <button
                  key={s.value} type="button"
                  onClick={() => setField('source', s.value)}
                  style={{ padding: '7px 14px', borderRadius: 4, border: '1px solid', borderColor: form.source === s.value ? s.color : 'var(--border)', background: form.source === s.value ? `${s.color}22` : 'transparent', color: form.source === s.value ? s.color : 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: 1, cursor: 'pointer' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Event Title *" value={form.title} onChange={(v) => setField('title', v)} required />
            <Field label="Headliner Artist" value={form.artist} onChange={(v) => setField('artist', v)} />
            <Field label="Supporting Acts (comma-separated)" value={form.supportingActs} onChange={(v) => setField('supportingActs', v)} />
            <Field label="Price Display (e.g. $20–$45)" value={form.priceDisplay} onChange={(v) => setField('priceDisplay', v)} />
          </div>

          <Section title="Dates">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Start Date & Time *" type="datetime-local" value={form.startDate} onChange={(v) => setField('startDate', v)} required />
              <Field label="End Date & Time" type="datetime-local" value={form.endDate} onChange={(v) => setField('endDate', v)} />
              <Field label="Doors Open" type="datetime-local" value={form.doorsOpen} onChange={(v) => setField('doorsOpen', v)} />
            </div>
          </Section>

          <Section title="Venue">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Venue Name *" value={form.venueName} onChange={(v) => setField('venueName', v)} required />
              <Field label="City *" value={form.city} onChange={(v) => setField('city', v)} required />
              <Field label="Address" value={form.address} onChange={(v) => setField('address', v)} />
              <Field label="ZIP" value={form.zip} onChange={(v) => setField('zip', v)} />
              <Field label="Latitude (for map)" value={form.lat} onChange={(v) => setField('lat', v)} type="number" step="any" />
              <Field label="Longitude (for map)" value={form.lng} onChange={(v) => setField('lng', v)} type="number" step="any" />
            </div>
          </Section>

          <Section title="Genre">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENRES.map((g) => (
                <button
                  key={g} type="button" onClick={() => toggleGenre(g)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid', borderColor: form.genres.includes(g) ? 'var(--purple)' : 'var(--border)', background: form.genres.includes(g) ? 'rgba(153,0,255,0.2)' : 'transparent', color: form.genres.includes(g) ? '#CC99FF' : 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                >
                  {g}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Event Type">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EVENT_TYPES.map((t) => (
                <button
                  key={t} type="button" onClick={() => setField('eventType', t)}
                  style={{ padding: '5px 12px', borderRadius: 4, border: '1px solid', borderColor: form.eventType === t ? 'var(--magenta)' : 'var(--border)', background: form.eventType === t ? 'rgba(255,0,119,0.1)' : 'transparent', color: form.eventType === t ? 'var(--magenta)' : 'var(--text-dim)', fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Links & Media">
            <Field label="External Ticket Link (full URL) *" value={form.externalTicketLink} onChange={(v) => setField('externalTicketLink', v)} required />
            <div style={{ marginTop: 12 }}>
              <Field label="Poster Image URL" value={form.posterImage} onChange={(v) => setField('posterImage', v)} />
            </div>
          </Section>

          <Section title="Options">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-dim)' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
              Feature this event (shows first in results)
            </label>
            <div style={{ marginTop: 12 }}>
              <Field label="Admin Notes (internal only)" value={form.adminNotes} onChange={(v) => setField('adminNotes', v)} />
            </div>
          </Section>

          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : editing ? 'Update Event' : 'Add Event'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setView('list')}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Analytics view ──────────────────────────────────────────────── */}
      {view === 'analytics' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 24, fontSize: 14 }}>Click-Through Analytics</h3>

          {analyticsData?.data?.bySource && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
                {analyticsData.data.bySource.map((row) => {
                  const src = SOURCES.find((s) => s.value === row._id);
                  return (
                    <div key={row._id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                      <div style={{ color: src?.color || '#888', fontFamily: 'var(--font-head)', fontSize: 12, letterSpacing: 2, marginBottom: 10 }}>{src?.label || row._id}</div>
                      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--cyan)', letterSpacing: 1 }}>{row.totalClickThroughs}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginTop: 4 }}>total clicks</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{row.totalEvents} events · avg {row.avgClicksPerEvent?.toFixed(1)} clicks/event</div>
                    </div>
                  );
                })}
              </div>

              {analyticsData.data.topEvents?.length > 0 && (
                <>
                  <h4 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 16, fontSize: 13, color: 'var(--text-dim)' }}>TOP EVENTS BY CLICKS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analyticsData.data.topEvents.map((ev) => {
                      const src = SOURCES.find((s) => s.value === ev.source);
                      return (
                        <div key={ev._id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 1 }}>{ev.title}</div>
                            <div style={{ fontSize: 10, color: src?.color || '#888', letterSpacing: 1, marginTop: 3 }}>{src?.label || ev.source} · {ev.city}</div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--cyan)', letterSpacing: 1 }}>{ev.clickThroughs}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small helper components ──────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, step }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={step}
        className="input"
        style={{ fontSize: 12 }}
      />
    </div>
  );
}
