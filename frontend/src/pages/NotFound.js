import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-head)', color: 'var(--magenta)', fontSize: 80, letterSpacing: 8, textShadow: '0 0 40px rgba(204,0,136,0.5)', marginBottom: 24 }}>404</div>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, letterSpacing: 4, marginBottom: 12 }}>SIGNAL LOST</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: 32 }}>This frequency doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to Discover</Link>
    </div>
  );
}
