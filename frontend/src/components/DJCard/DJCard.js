import React from 'react';
import { Link } from 'react-router-dom';
import './DJCard.css';

export default function DJCard({ dj }) {
  const { slug, stageName, profilePhoto, bannerImage, genres = [], homeCity, rating, totalBookings, isVerified, isFeatured, theme } = dj;

  const accent = theme?.primaryColor || '#CC0088';

  return (
    <Link to={`/djs/${slug}`} className="dj-card" style={{ '--dj-accent': accent }}>
      {/* Banner */}
      <div className="dj-card__banner">
        {bannerImage
          ? <img src={bannerImage} alt="" loading="lazy" />
          : <div className="dj-card__banner-placeholder" style={{ background: `linear-gradient(135deg, ${accent}22, #0A001A)` }} />
        }
        <div className="dj-card__banner-overlay" />
        {isFeatured && <span className="dj-card__featured">★ FEATURED</span>}
      </div>

      {/* Avatar */}
      <div className="dj-card__avatar-wrap">
        {profilePhoto
          ? <img src={profilePhoto} alt={stageName} className="dj-card__avatar" />
          : <div className="dj-card__avatar-fallback" style={{ borderColor: accent }}>
              {stageName[0].toUpperCase()}
            </div>
        }
        {isVerified && <span className="dj-card__verified" title="Verified DJ">✓</span>}
      </div>

      {/* Info */}
      <div className="dj-card__body">
        <h3 className="dj-card__name" style={{ color: accent }}>{stageName}</h3>
        {homeCity && <p className="dj-card__city">📍 {homeCity}, CA</p>}

        {genres.length > 0 && (
          <div className="dj-card__genres">
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="genre-pill">{g}</span>
            ))}
          </div>
        )}

        <div className="dj-card__stats">
          {rating > 0 && (
            <span className="dj-stat">
              ★ {rating.toFixed(1)}
            </span>
          )}
          {totalBookings > 0 && (
            <span className="dj-stat">
              {totalBookings} bookings
            </span>
          )}
        </div>

        <button className="btn btn-outline btn-sm dj-card__cta" style={{ borderColor: accent, color: accent }}>
          View Profile
        </button>
      </div>
    </Link>
  );
}
