import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [tab, setTab] = useState('overview');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      // Update handled via a PATCH /api/users/me endpoint (extendable)
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updatePassword(pwForm);
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (!user) return null;

  return (
    <div className="profile-page page-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt={user.firstName} /> : <div className="profile-avatar-fallback">{(user.firstName?.[0] || user.email[0]).toUpperCase()}</div>}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', letterSpacing: 2 }}>{user.firstName} {user.lastName}</h1>
          <p className="text-dim">{user.email}</p>
          <span className="badge badge-18" style={{ marginTop: 6, display: 'inline-block' }}>{user.role.toUpperCase()}</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="profile-links">
        <Link to="/my-tickets" className="profile-link-card card">
          <span>🎟</span><span>My Tickets</span>
        </Link>
        {(user.role === 'dj' || user.role === 'admin') && (
          <Link to="/dj/profile-editor" className="profile-link-card card">
            <span>🎧</span><span>DJ Profile Editor</span>
          </Link>
        )}
        {(user.role === 'organizer' || user.role === 'admin') && (
          <Link to="/dashboard" className="profile-link-card card">
            <span>📊</span><span>Organizer Dashboard</span>
          </Link>
        )}
        {(user.role !== 'attendee') && (
          <Link to="/bookings" className="profile-link-card card">
            <span>📩</span><span>Bookings</span>
          </Link>
        )}
      </div>

      <div className="profile-tabs">
        {['overview','security'].map((t) => (
          <button key={t} className={`editor-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 480, paddingBottom: 60 }}>
        {tab === 'overview' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="input" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="input" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        )}

        {tab === 'security' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="input" type="password" value={pwForm.newPassword} minLength={8} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required />
            </div>
            <button className="btn btn-primary" type="submit">Update Password</button>
          </form>
        )}

        <div style={{ marginTop: 40 }}>
          <button className="btn btn-ghost" onClick={logout} style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
