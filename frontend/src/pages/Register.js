import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const ROLES = [
  { value: 'attendee', label: '🎟 Fan / Attendee', desc: 'Discover events and buy tickets' },
  { value: 'dj', label: '🎧 DJ', desc: 'Create a profile and get booked' },
  { value: 'organizer', label: '🎪 Event Organizer', desc: 'Create and manage events' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'attendee', dateOfBirth: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Age check
    if (form.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(form.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) { toast.error('You must be 18+ to use RESONANCE'); return; }
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
      toast.success('Welcome to RESONANCE! 🎵');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">◈ RESONANCE</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub text-dim">California's EDM platform · 18+ only</p>

        {/* Step indicator */}
        <div className="auth-steps">
          <div className={`auth-step${step >= 1 ? ' active' : ''}`}>1 Account</div>
          <div className="auth-step-line" />
          <div className={`auth-step${step >= 2 ? ' active' : ''}`}>2 Identity</div>
          <div className="auth-step-line" />
          <div className={`auth-step${step >= 3 ? ' active' : ''}`}>3 Role</div>
        </div>

        <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep((s) => s + 1); } : handleSubmit} className="auth-form">
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Password (min 8 characters)</label>
                <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} minLength={8} required />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth (must be 18+)</label>
                <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required />
              </div>
              <div className="age-notice">
                🔞 RESONANCE is strictly 18+. Valid government ID required at all events.
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-label" style={{ marginBottom: 12 }}>I am a...</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {ROLES.map((r) => (
                  <label key={r.value} className={`role-option${form.role === r.value ? ' selected' : ''}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set('role', r.value)} style={{ display: 'none' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.label}</div>
                      <div className="text-dim" style={{ fontSize: 12, marginTop: 2 }}>{r.desc}</div>
                    </div>
                    {form.role === r.value && <span style={{ color: 'var(--magenta)', marginLeft: 'auto' }}>✓</span>}
                  </label>
                ))}
              </div>
            </>
          )}

          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {step < 3 ? 'Continue →' : loading ? 'Creating account...' : 'Create Account'}
          </button>
          {step > 1 && (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
        </form>

        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
