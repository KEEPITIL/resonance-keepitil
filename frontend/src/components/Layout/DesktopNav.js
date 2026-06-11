import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DesktopNav.css';

export default function DesktopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="desktop-nav">
      <div className="desktop-nav__inner">
        {/* Logo */}
        <Link to="/" className="desktop-nav__logo">
          <span className="logo-diamond">◈</span>
          <span className="logo-text">RESONANCE</span>
        </Link>

        {/* Main links */}
        <div className="desktop-nav__links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Discover
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Explore CA
          </NavLink>
          <NavLink to="/djs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            DJs
          </NavLink>
        </div>

        {/* Right side */}
        <div className="desktop-nav__right">
          {user ? (
            <div className="user-menu">
              <button className="user-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.firstName} className="user-avatar-img" />
                  : <span className="user-avatar-fallback">{(user.firstName?.[0] || user.email[0]).toUpperCase()}</span>
                }
                <span className="user-name">{user.firstName || user.email.split('@')[0]}</span>
                <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div className="user-dropdown">
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>
                  <Link to="/my-tickets" onClick={() => setMenuOpen(false)}>My Tickets</Link>
                  {(user.role === 'organizer' || user.role === 'admin') && (
                    <>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                      <Link to="/events/create" onClick={() => setMenuOpen(false)}>Create Event</Link>
                    </>
                  )}
                  {(user.role === 'dj' || user.role === 'admin') && (
                    <Link to="/dj/profile-editor" onClick={() => setMenuOpen(false)}>DJ Profile Editor</Link>
                  )}
                  {(user.role === 'dj' || user.role === 'organizer' || user.role === 'admin') && (
                    <Link to="/bookings" onClick={() => setMenuOpen(false)}>Bookings</Link>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <hr />
                      <Link to="/admin/external-events" onClick={() => setMenuOpen(false)} style={{ color: 'var(--magenta)' }}>◈ Admin: External Events</Link>
                    </>
                  )}
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
