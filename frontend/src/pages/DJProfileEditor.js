import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { djsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './DJProfileEditor.css';

const GENRES = ['House','Techno','Trance','Drum & Bass','Dubstep','EDM','Hardstyle','Deep House','Tech House','Progressive House','Electro','Future Bass','Melodic Techno','Psytrance','Ambient','Trap','Bass Music'];
const FONTS = ['Orbitron','Space Mono','Rajdhani','Exo 2','Play'];
const WIDGET_TYPES = [
  { value: 'spotify_track', label: '🎵 Spotify Track' },
  { value: 'soundcloud_track', label: '🔊 SoundCloud' },
  { value: 'youtube_video', label: '▶ YouTube Video' },
];
const TABS = ['Profile','Theme','Media','Widgets','Social','Booking'];

export default function DJProfileEditor() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Profile');
  const [form, setForm] = useState({
    stageName: '', genres: [], bio: '', shortBio: '', homeCity: '',
    bookingEnabled: true, minBookingFee: 0, maxBookingFee: '', bookingEmail: '', bookingNotes: '',
    theme: { primaryColor: '#CC0088', secondaryColor: '#00FFFF', accentColor: '#9900FF', backgroundColor: '#0A0A0A', textColor: '#FFFFFF', fontFamily: 'Orbitron', backgroundStyle: 'gradient' },
    socialLinks: { instagram: '', soundcloud: '', spotify: '', youtube: '', facebook: '', twitter: '', tiktok: '', website: '' },
    isPublished: false,
  });
  const [newWidget, setNewWidget] = useState({ type: 'spotify_track', url: '', title: '' });
  const photoRef = useRef(); const bannerRef = useRef(); const logoRef = useRef(); const galleryRef = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ['dj-me'],
    queryFn: () => djsAPI.getMe().then((r) => r.data),
    retry: false,
  });

  useEffect(() => {
    if (data?.data) {
      const dj = data.data;
      setForm({
        stageName: dj.stageName || '',
        genres: dj.genres || [],
        bio: dj.bio || '',
        shortBio: dj.shortBio || '',
        homeCity: dj.homeCity || '',
        bookingEnabled: dj.bookingEnabled ?? true,
        minBookingFee: dj.minBookingFee || 0,
        maxBookingFee: dj.maxBookingFee || '',
        bookingEmail: dj.bookingEmail || '',
        bookingNotes: dj.bookingNotes || '',
        theme: { ...{ primaryColor:'#CC0088', secondaryColor:'#00FFFF', accentColor:'#9900FF', backgroundColor:'#0A0A0A', textColor:'#FFFFFF', fontFamily:'Orbitron', backgroundStyle:'gradient' }, ...(dj.theme || {}) },
        socialLinks: { instagram:'', soundcloud:'', spotify:'', youtube:'', facebook:'', twitter:'', tiktok:'', website:'', ...(dj.socialLinks || {}) },
        isPublished: dj.isPublished || false,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => data?.data ? djsAPI.update(payload) : djsAPI.create(payload),
    onSuccess: () => { toast.success('Profile saved!'); qc.invalidateQueries(['dj-me']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const widgetDeleteMutation = useMutation({
    mutationFn: (widgetId) => djsAPI.removeWidget(widgetId),
    onSuccess: () => { toast.success('Widget removed'); qc.invalidateQueries(['dj-me']); },
  });

  const widgetAddMutation = useMutation({
    mutationFn: (w) => djsAPI.addWidget(w),
    onSuccess: () => { toast.success('Widget added'); qc.invalidateQueries(['dj-me']); setNewWidget({ type: 'spotify_track', url: '', title: '' }); },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ field, file }) => {
      const fd = new FormData(); fd.append(field, file);
      if (field === 'photo') return djsAPI.uploadPhoto(fd);
      if (field === 'banner') return djsAPI.uploadBanner(fd);
      if (field === 'logo') return djsAPI.uploadLogo(fd);
      if (field === 'images') return djsAPI.uploadGallery(fd);
    },
    onSuccess: () => { toast.success('Uploaded!'); qc.invalidateQueries(['dj-me']); },
    onError: () => toast.error('Upload failed'),
  });

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setTheme = (key, val) => setForm((p) => ({ ...p, theme: { ...p.theme, [key]: val } }));
  const setSocial = (key, val) => setForm((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: val } }));
  const toggleGenre = (g) => setField('genres', form.genres.includes(g) ? form.genres.filter((x) => x !== g) : [...form.genres, g]);

  const dj = data?.data;
  const accent = form.theme.primaryColor;

  if (isLoading) return <div className="spinner" style={{ marginTop: 80 }} />;

  return (
    <div className="dj-editor page-container">
      <div className="dj-editor__header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', color: accent, letterSpacing: 3 }}>DJ PROFILE EDITOR</h1>
          <p className="text-dim">Customize your public DJ page</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="publish-toggle">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setField('isPublished', e.target.checked)} />
            <span>{form.isPublished ? '🟢 Published' : '⚫ Draft'}</span>
          </label>
          {dj?.slug && (
            <a href={`/djs/${dj.slug}`} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">Preview ↗</a>
          )}
          <button className="btn btn-primary btn-sm" style={{ background: accent }} onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dj-editor__tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`editor-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)} style={activeTab === tab ? { borderColor: accent, color: accent } : {}}>
            {tab}
          </button>
        ))}
      </div>

      <div className="dj-editor__body">
        {/* ── PROFILE TAB ──────────────────────────────── */}
        {activeTab === 'Profile' && (
          <div className="editor-panel">
            <div className="form-group">
              <label className="form-label">Stage Name *</label>
              <input className="input" value={form.stageName} onChange={(e) => setField('stageName', e.target.value)} placeholder="Your DJ name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Home City</label>
              <input className="input" value={form.homeCity} onChange={(e) => setField('homeCity', e.target.value)} placeholder="e.g. Los Angeles" />
            </div>
            <div className="form-group">
              <label className="form-label">Short Bio (shown on cards)</label>
              <textarea className="input" rows={2} value={form.shortBio} onChange={(e) => setField('shortBio', e.target.value)} maxLength={200} placeholder="One-line description..." />
            </div>
            <div className="form-group">
              <label className="form-label">Full Bio</label>
              <textarea className="input" rows={6} value={form.bio} onChange={(e) => setField('bio', e.target.value)} maxLength={2000} placeholder="Tell bookers and fans about yourself..." />
            </div>
            <div className="form-group">
              <label className="form-label">Genres</label>
              <div className="genre-picker">
                {GENRES.map((g) => (
                  <button key={g} type="button" className={`genre-pick-btn${form.genres.includes(g) ? ' active' : ''}`} style={form.genres.includes(g) ? { background: accent, borderColor: accent } : {}} onClick={() => toggleGenre(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── THEME TAB ──────────────────────────────── */}
        {activeTab === 'Theme' && (
          <div className="editor-panel">
            <div className="theme-preview" style={{ background: form.theme.backgroundColor, borderColor: accent }}>
              <div style={{ fontFamily: `'${form.theme.fontFamily}', sans-serif`, color: form.theme.primaryColor, fontSize: 22, letterSpacing: 4, textShadow: `0 0 20px ${form.theme.primaryColor}` }}>
                {form.stageName || 'STAGE NAME'}
              </div>
              <div style={{ color: form.theme.textColor, fontSize: 13, marginTop: 8, opacity: 0.7 }}>Your public profile preview</div>
            </div>

            <div className="color-grid">
              {[
                ['primaryColor', 'Primary Color'],
                ['secondaryColor', 'Secondary Color'],
                ['accentColor', 'Accent Color'],
                ['backgroundColor', 'Background Color'],
                ['textColor', 'Text Color'],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={form.theme[key]} onChange={(e) => setTheme(key, e.target.value)} className="color-swatch" />
                    <input className="input" value={form.theme[key]} onChange={(e) => setTheme(key, e.target.value)} placeholder="#CC0088" style={{ flex: 1 }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Font Family</label>
              <select className="input" value={form.theme.fontFamily} onChange={(e) => setTheme('fontFamily', e.target.value)}>
                {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── MEDIA TAB ──────────────────────────────── */}
        {activeTab === 'Media' && (
          <div className="editor-panel">
            {[
              { label: 'Profile Photo', field: 'photo', current: dj?.profilePhoto, accept: 'image/*', ref: photoRef },
              { label: 'Banner Image', field: 'banner', current: dj?.bannerImage, accept: 'image/*', ref: bannerRef },
              { label: 'Logo', field: 'logo', current: dj?.logoImage, accept: 'image/*', ref: logoRef },
            ].map(({ label, field, current, accept, ref }) => (
              <div key={field} className="media-upload-row">
                <div>
                  <div className="form-label">{label}</div>
                  {current && <img src={current} alt={label} className="media-preview" />}
                </div>
                <div>
                  <input type="file" accept={accept} style={{ display: 'none' }} ref={ref} onChange={(e) => { if (e.target.files[0]) uploadMutation.mutate({ field, file: e.target.files[0] }); }} />
                  <button className="btn btn-outline btn-sm" style={{ borderColor: accent, color: accent }} onClick={() => ref.current.click()}>
                    Upload {label}
                  </button>
                </div>
              </div>
            ))}

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Gallery Images</label>
              {dj?.galleryImages?.length > 0 && (
                <div className="gallery-preview">
                  {dj.galleryImages.map((img, i) => <img key={i} src={img} alt={`Gallery ${i}`} className="gallery-thumb" />)}
                </div>
              )}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} ref={galleryRef}
                onChange={(e) => { if (e.target.files.length) { const fd = new FormData(); Array.from(e.target.files).forEach((f) => fd.append('images', f)); uploadMutation.mutate({ field: 'images', file: null, formData: fd }); } }}
              />
              <button className="btn btn-outline btn-sm" style={{ borderColor: accent, color: accent }} onClick={() => galleryRef.current.click()}>Add Gallery Photos</button>
            </div>
          </div>
        )}

        {/* ── WIDGETS TAB ──────────────────────────────── */}
        {activeTab === 'Widgets' && (
          <div className="editor-panel">
            <h3 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 16 }}>Active Widgets</h3>
            {dj?.widgets?.length === 0 && <p className="text-dim">No widgets yet. Add music embeds below.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {(dj?.widgets || []).map((w) => (
                <div key={w._id} className="widget-item">
                  <span className="text-dim" style={{ fontSize: 12 }}>{WIDGET_TYPES.find((t) => t.value === w.type)?.label || w.type}</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title || w.url}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => widgetDeleteMutation.mutate(w._id)}>Remove</button>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20, borderColor: `${accent}44` }}>
              <h4 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2, marginBottom: 16, color: accent }}>Add Widget</h4>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="input" value={newWidget.type} onChange={(e) => setNewWidget((p) => ({ ...p, type: e.target.value }))}>
                  {WIDGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title (optional)</label>
                <input className="input" value={newWidget.title} onChange={(e) => setNewWidget((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. My Latest Track" />
              </div>
              <div className="form-group">
                <label className="form-label">URL</label>
                <input className="input" value={newWidget.url} onChange={(e) => setNewWidget((p) => ({ ...p, url: e.target.value }))} placeholder="Paste URL here..." />
              </div>
              <button className="btn btn-primary btn-sm" style={{ background: accent }} onClick={() => widgetAddMutation.mutate(newWidget)} disabled={!newWidget.url}>
                Add Widget
              </button>
            </div>
          </div>
        )}

        {/* ── SOCIAL TAB ──────────────────────────────── */}
        {activeTab === 'Social' && (
          <div className="editor-panel">
            {Object.keys(form.socialLinks).map((platform) => (
              <div className="form-group" key={platform}>
                <label className="form-label">{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                <input className="input" value={form.socialLinks[platform]} onChange={(e) => setSocial(platform, e.target.value)} placeholder={`Your ${platform} URL or handle`} />
              </div>
            ))}
          </div>
        )}

        {/* ── BOOKING TAB ──────────────────────────────── */}
        {activeTab === 'Booking' && (
          <div className="editor-panel">
            <label className="publish-toggle" style={{ marginBottom: 20 }}>
              <input type="checkbox" checked={form.bookingEnabled} onChange={(e) => setField('bookingEnabled', e.target.checked)} />
              <span>{form.bookingEnabled ? '✅ Accepting Bookings' : '❌ Not Accepting Bookings'}</span>
            </label>
            <div className="form-group">
              <label className="form-label">Booking Contact Email</label>
              <input className="input" type="email" value={form.bookingEmail} onChange={(e) => setField('bookingEmail', e.target.value)} placeholder="booking@youremail.com" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Min Fee (USD)</label>
                <input className="input" type="number" value={form.minBookingFee} onChange={(e) => setField('minBookingFee', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Fee (USD)</label>
                <input className="input" type="number" value={form.maxBookingFee} onChange={(e) => setField('maxBookingFee', e.target.value)} placeholder="Leave blank = negotiable" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Booking Notes</label>
              <textarea className="input" rows={4} value={form.bookingNotes} onChange={(e) => setField('bookingNotes', e.target.value)} placeholder="Requirements, rider info, what you need from organizers..." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
