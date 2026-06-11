import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { djsAPI, bookingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './DJProfile.css';

export default function DJProfile() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dj', slug],
    queryFn: () => djsAPI.getBySlug(slug).then((r) => r.data),
  });

  if (isLoading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!data?.data) return <div style={{ textAlign: 'center', padding: 80 }}>DJ not found</div>;

  const dj = data.data;
  const { stageName, bio, profilePhoto, bannerImage, logoImage, genres = [], socialLinks = {}, widgets = [], theme = {}, homeCity, isVerified, totalBookings, rating, bookingEnabled } = dj;

  const accent = theme.primaryColor || '#CC0088';
  const bg = theme.backgroundColor || '#0A0A0A';
  const font = theme.fontFamily || 'Orbitron';

  return (
    <div className="dj-profile-page" style={{ '--accent': accent, '--dj-bg': bg, fontFamily: `'${font}', sans-serif` }}>
      {/* Banner */}
      <div className="djp-banner" style={{ backgroundImage: bannerImage ? `url(${bannerImage})` : undefined }}>
        {!bannerImage && <div className="djp-banner-fallback" style={{ background: `linear-gradient(135deg, ${accent}33, #0A001A)` }} />}
        <div className="djp-banner-overlay" />
      </div>

      <div className="page-container">
        {/* Header */}
        <div className="djp-header">
          <div className="djp-avatar-wrap">
            {profilePhoto
              ? <img src={profilePhoto} alt={stageName} className="djp-avatar" style={{ borderColor: accent }} />
              : <div className="djp-avatar-fallback" style={{ borderColor: accent, color: accent }}>{stageName[0]}</div>
            }
            {isVerified && <span className="djp-verified" style={{ background: '#00FFFF', color: '#000' }}>✓</span>}
          </div>

          <div className="djp-header-info">
            {logoImage && <img src={logoImage} alt="logo" className="djp-logo" />}
            <h1 className="djp-stage-name" style={{ color: accent, fontFamily: `'${font}', sans-serif` }}>{stageName}</h1>
            {homeCity && <div className="djp-city text-dim">📍 {homeCity}, California</div>}

            <div className="djp-genres">
              {genres.map((g) => <span key={g} className="genre-pill">{g}</span>)}
            </div>

            <div className="djp-stats">
              {rating > 0 && <div className="djp-stat"><span className="djp-stat-val">★ {rating.toFixed(1)}</span><span className="djp-stat-label">Rating</span></div>}
              {totalBookings > 0 && <div className="djp-stat"><span className="djp-stat-val">{totalBookings}</span><span className="djp-stat-label">Bookings</span></div>}
            </div>
          </div>

          <div className="djp-actions">
            {bookingEnabled && (user?.role === 'organizer' || user?.role === 'admin') && (
              <button className="btn btn-primary" style={{ background: accent }} onClick={() => setShowBookingForm(true)}>
                Book DJ
              </button>
            )}
            {!user && bookingEnabled && (
              <button className="btn btn-outline" style={{ borderColor: accent, color: accent }} onClick={() => window.location.href = '/login'}>
                Sign in to Book
              </button>
            )}
          </div>
        </div>

        <div className="djp-grid">
          {/* Main */}
          <div className="djp-main">
            {bio && (
              <section className="djp-section">
                <h2 className="djp-section-title" style={{ color: accent }}>About</h2>
                <p className="djp-bio">{bio}</p>
              </section>
            )}

            {/* Widgets */}
            {widgets.filter((w) => w.isVisible).sort((a, b) => a.order - b.order).map((widget) => (
              <WidgetBlock key={widget._id} widget={widget} accent={accent} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="djp-sidebar">
            {/* Social links */}
            {Object.keys(socialLinks).some((k) => socialLinks[k]) && (
              <div className="djp-socials card" style={{ borderColor: `${accent}44` }}>
                <h3 className="djp-section-title" style={{ color: accent, fontSize: 12 }}>Connect</h3>
                {Object.entries(socialLinks).filter(([, v]) => v).map(([platform, url]) => (
                  <a key={platform} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="djp-social-link">
                    <span className="djp-social-platform">{platform.toUpperCase()}</span>
                    <span style={{ color: accent }}>↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {showBookingForm && (
        <BookingModal dj={dj} accent={accent} onClose={() => setShowBookingForm(false)} />
      )}
    </div>
  );
}

function WidgetBlock({ widget, accent }) {
  const { type, url, embedId, title } = widget;

  const getSpotifyEmbed = () => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    const id = embedId || match?.[1];
    return id ? `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0` : null;
  };

  const getSoundcloudEmbed = () => url ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23CC0088&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true` : null;

  const getYoutubeEmbed = () => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([a-zA-Z0-9_-]{11})/);
    const id = embedId || match?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  return (
    <section className="djp-widget">
      {title && <h3 className="djp-section-title" style={{ color: accent }}>{title}</h3>}
      {type === 'spotify_track' && getSpotifyEmbed() && (
        <iframe src={getSpotifyEmbed()} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="Spotify" style={{ borderRadius: 12 }} />
      )}
      {type === 'soundcloud_track' && getSoundcloudEmbed() && (
        <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay" src={getSoundcloudEmbed()} title="SoundCloud" />
      )}
      {type === 'youtube_video' && getYoutubeEmbed() && (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8 }}>
          <iframe src={getYoutubeEmbed()} title="YouTube" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} frameBorder="0" allowFullScreen />
        </div>
      )}
    </section>
  );
}

function BookingModal({ dj, accent, onClose }) {
  const [form, setForm] = useState({ proposedFee: '', performanceDate: '', setDuration: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bookingsAPI.create({ djProfileId: dj._id, ...form, proposedFee: Number(form.proposedFee) });
      toast.success('Booking inquiry sent!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send booking request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box card" onClick={(e) => e.stopPropagation()} style={{ borderColor: accent }}>
        <h2 style={{ fontFamily: 'var(--font-head)', color: accent, letterSpacing: 2 }}>Book {dj.stageName}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div className="form-group">
            <label className="form-label">Proposed Fee (USD)</label>
            <input className="input" type="number" placeholder="e.g. 500" value={form.proposedFee} onChange={(e) => setForm((p) => ({ ...p, proposedFee: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Performance Date</label>
            <input className="input" type="datetime-local" value={form.performanceDate} onChange={(e) => setForm((p) => ({ ...p, performanceDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Set Duration (minutes)</label>
            <input className="input" type="number" placeholder="e.g. 60" value={form.setDuration} onChange={(e) => setForm((p) => ({ ...p, setDuration: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="input" rows={3} placeholder="Event details, genre preferences..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ background: accent, justifyContent: 'center' }}>
            {submitting ? 'Sending...' : 'Send Booking Request'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
