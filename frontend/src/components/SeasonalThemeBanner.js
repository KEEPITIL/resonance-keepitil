/**
 * SeasonalThemeBanner
 *
 * A slim, dismissible banner shown at the top of the app when a seasonal
 * theme is active. Auto-hides if the user dismisses it (stored per-theme-key
 * so it reappears each new month).
 *
 * Visual: animated gradient using CSS vars so it always matches the theme.
 */

import React, { useState, useEffect } from 'react';
import { getActiveTheme } from '../utils/seasonalTheme';

export default function SeasonalThemeBanner() {
  const theme = getActiveTheme();
  const storageKey = `rsn_banner_dismissed_${theme.key}`;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show the "default" fallback banner
    if (theme.key === 'default') return;
    try {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    } catch (_) {
      setVisible(true);
    }
  }, [theme.key, storageKey]);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(storageKey, '1'); } catch (_) {}
  }

  if (!visible) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.glow} />
      <span style={styles.emoji}>{theme.emoji}</span>
      <span style={styles.text}>
        <strong style={{ color: 'var(--magenta)' }}>{theme.name}</strong>
        &nbsp;&mdash;&nbsp;
        <span style={{ color: 'var(--cyan)', opacity: 0.85 }}>{theme.description}</span>
      </span>
      <button
        onClick={dismiss}
        style={styles.close}
        aria-label="Dismiss"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '7px 48px 7px 16px',
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    overflow: 'hidden',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    letterSpacing: 1,
    zIndex: 10,
    flexShrink: 0,
  },
  glow: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, var(--glow-primary, rgba(204,0,136,0.08)) 0%, transparent 40%, transparent 60%, var(--glow-secondary, rgba(0,255,255,0.06)) 100%)',
    pointerEvents: 'none',
  },
  emoji: {
    fontSize: 16,
    lineHeight: 1,
    position: 'relative',
  },
  text: {
    color: '#aaa',
    position: 'relative',
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
    padding: '4px 6px',
    transition: 'color 0.2s',
  },
};
