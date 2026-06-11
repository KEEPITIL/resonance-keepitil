import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './EventDetail.css';

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => eventsAPI.getBySlug(slug).then((r) => r.data),
  });

  if (isLoading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!data?.data) return <div style={{ textAlign: 'center', padding: 80 }}>Event not found</div>;

  const event = data.data;
  const { title, description, coverImage, startDate, endDate, doorsOpen, venue, genres = [], lineup = [], ticketTiers = [], isFree, eventType, promoVideoUrl } = event;

  const handleBuyTicket = () => {
    if (!selectedTier) return;
    if (!user) { navigate('/login'); return; }
    navigate(`/checkout/${event._id}/${selectedTier._id}`);
  };

  return (
    <div className="event-detail">
      {/* Hero */}
      <div className="event-detail__hero" style={{ backgroundImage: coverImage ? `url(${coverImage})` : undefined }}>
        <div className="event-detail__hero-overlay" />
        <div className="event-detail__hero-content page-container">
          <div className="event-detail__badges">
            {genres.map((g) => <span key={g} className="genre-pill">{g}</span>)}
            <span className="badge badge-18">18+</span>
            {eventType && <span className="badge" style={{ background: 'rgba(0,255,255,0.1)', color: '#00FFFF', border: '1px solid rgba(0,255,255,0.4)' }}>
              {eventType.replace('_', ' ').toUpperCase()}
            </span>}
          </div>
          <h1 className="event-detail__title">{title}</h1>
          <div className="event-detail__meta">
            <span>📅 {format(new Date(startDate), 'EEEE, MMMM d, yyyy')}</span>
            <span>🕐 {format(new Date(startDate), 'h:mm a')}{doorsOpen ? ` (Doors ${format(new Date(doorsOpen), 'h:mm a')})` : ''}</span>
            <span>📍 {venue?.name}, {venue?.city}, CA</span>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="event-detail__grid">
          {/* Left: info */}
          <div className="event-detail__left">
            {description && (
              <section className="event-section">
                <h2 className="event-section__title">About This Event</h2>
                <p className="event-section__body">{description}</p>
              </section>
            )}

            {lineup.length > 0 && (
              <section className="event-section">
                <h2 className="event-section__title">Lineup</h2>
                <div className="lineup-list">
                  {[...lineup].sort((a, b) => a.order - b.order).map((l, i) => (
                    <div key={i} className={`lineup-item${l.isHeadliner ? ' headliner' : ''}`}>
                      {l.isHeadliner && <span className="lineup-headliner-badge">HEADLINER</span>}
                      <span className="lineup-name">
                        {l.dj?.slug
                          ? <Link to={`/djs/${l.dj.slug}`}>{l.dj.stageName || l.djName}</Link>
                          : l.djName
                        }
                      </span>
                      {l.startTime && <span className="lineup-time text-dim">{l.startTime}{l.endTime ? ` – ${l.endTime}` : ''}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {promoVideoUrl && (
              <section className="event-section">
                <h2 className="event-section__title">Preview</h2>
                <div className="video-embed">
                  <iframe
                    src={promoVideoUrl.replace('watch?v=', 'embed/')}
                    frameBorder="0"
                    allowFullScreen
                    title="Event preview"
                  />
                </div>
              </section>
            )}

            <section className="event-section">
              <h2 className="event-section__title">Venue</h2>
              <div className="venue-info">
                <div className="venue-name">{venue?.name}</div>
                {venue?.address && <div className="venue-address text-dim">{venue.address}</div>}
                <div className="venue-city text-dim">{venue?.city}, CA {venue?.zip}</div>
                {venue?.ageRestriction && <span className="badge badge-18" style={{ marginTop: 8 }}>{venue.ageRestriction}+ EVENT — VALID ID REQUIRED</span>}
              </div>
            </section>
          </div>

          {/* Right: ticket purchase */}
          <div className="event-detail__right">
            <div className="ticket-panel card">
              <div className="ticket-panel__header">
                <h3>Get Tickets</h3>
                <span className="badge badge-18">18+ w/ Valid ID</span>
              </div>

              {isFree ? (
                <div className="ticket-tier free-tier">
                  <span>FREE ENTRY</span>
                  <span className="text-cyan">$0.00</span>
                </div>
              ) : (
                <div className="ticket-tiers">
                  {ticketTiers.filter((t) => t.isVisible && t.isActive).map((tier) => {
                    const remaining = tier.quantity - tier.quantitySold;
                    const soldOut = remaining <= 0;
                    return (
                      <button
                        key={tier._id}
                        className={`ticket-tier${selectedTier?._id === tier._id ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}
                        onClick={() => !soldOut && setSelectedTier(tier)}
                        disabled={soldOut}
                      >
                        <div className="ticket-tier__info">
                          <span className="ticket-tier__name">{tier.name}</span>
                          {tier.description && <span className="ticket-tier__desc text-dim">{tier.description}</span>}
                          {!soldOut && remaining < 20 && (
                            <span style={{ color: 'var(--orange)', fontSize: 11 }}>⚡ {remaining} left</span>
                          )}
                        </div>
                        <div className="ticket-tier__price">
                          {soldOut ? <span className="badge badge-sold">SOLD OUT</span> : `$${tier.price.toFixed(2)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTier && (
                <div className="ticket-fee-note">
                  <span>Ticket price</span><span>${selectedTier.price.toFixed(2)}</span>
                  <span>Platform fee (2.5%)</span><span>${(selectedTier.price * 0.025).toFixed(2)}</span>
                  <hr />
                  <strong>Total</strong><strong>${(selectedTier.price * 1.025).toFixed(2)}</strong>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                onClick={handleBuyTicket}
                disabled={!isFree && !selectedTier}
              >
                {user ? 'Buy Tickets' : 'Sign In to Buy Tickets'}
              </button>

              <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
                Must be 18+ with valid government-issued ID at door.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
