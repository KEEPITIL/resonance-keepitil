/**
 * RESONANCE — Seasonal & Holiday Theme System
 *
 * Automatically shifts the platform's neon color palette based on the current
 * month and proximity to major American holidays / seasons.
 * Base dark backgrounds never change — only the 4 accent colors rotate.
 *
 * How it works:
 *  1. seasonalTheme.js exports THEMES (the config) and getActiveTheme()
 *  2. useSeasonalTheme() hook reads the active theme and writes CSS variables
 *     onto document.documentElement so all existing var(--magenta) etc. update
 *  3. App.js calls useSeasonalTheme() once at the root — zero other changes needed
 *  4. To preview a future theme during dev: ?theme=halloween in the URL
 */

import { useEffect } from 'react';

// ─── Theme Definitions ────────────────────────────────────────────────────────
// Each theme overrides only the 4 accent variables. Backgrounds stay dark.
// primary   = replaces --magenta  (main CTA, headings, glows)
// secondary = replaces --cyan     (dates, links, secondary accents)
// tertiary  = replaces --purple   (genre pills, badge backgrounds)
// highlight = replaces --orange   (warnings, "From $X" prices, hot items)
// bg3       = replaces --bg3      (subtle tinted card background)
// border    = replaces --border   (card borders)

export const THEMES = {
  // ── January: New Year's ──────────────────────────────────────────────────
  newyear: {
    name: "New Year's",
    emoji: '🎆',
    months: [1],
    primary:   '#FFD700',   // gold
    secondary: '#C0C0C0',   // silver
    tertiary:  '#4466AA',   // midnight blue
    highlight: '#FFD700',
    bg3:       '#0A0A0F',
    border:    '#2A2A1A',
    description: 'Gold & silver ring in the new year',
  },

  // ── February: Valentine's Day ────────────────────────────────────────────
  valentines: {
    name: "Valentine's Day",
    emoji: '💜',
    months: [2],
    primary:   '#FF2D78',   // hot pink
    secondary: '#FF6BA8',   // rose
    tertiary:  '#C2185B',   // deep red-pink
    highlight: '#FF2D78',
    bg3:       '#140008',
    border:    '#3A0A1A',
    description: 'Love is in the air',
  },

  // ── March: St. Patrick's Day ─────────────────────────────────────────────
  stpatricks: {
    name: "St. Patrick's Day",
    emoji: '🍀',
    months: [3],
    primary:   '#00CC44',   // kelly green
    secondary: '#00FF77',   // bright green
    tertiary:  '#FFD700',   // gold
    highlight: '#00CC44',
    bg3:       '#000F04',
    border:    '#0A2A14',
    description: 'Green lights, good vibes',
  },

  // ── April: Spring / Easter ───────────────────────────────────────────────
  spring: {
    name: 'Spring',
    emoji: '🌸',
    months: [4],
    primary:   '#DD44CC',   // lavender-magenta
    secondary: '#66EE88',   // pastel green
    tertiary:  '#AA66FF',   // soft purple
    highlight: '#FFAA44',
    bg3:       '#0F080F',
    border:    '#2A1A2A',
    description: 'New season, new energy',
  },

  // ── May: Memorial Day / Late Spring ─────────────────────────────────────
  memorial: {
    name: 'Memorial Day',
    emoji: '🇺🇸',
    months: [5],
    primary:   '#CC0033',   // red
    secondary: '#4488FF',   // blue
    tertiary:  '#FFFFFF',   // white (on dark)
    highlight: '#CC0033',
    bg3:       '#0A000A',
    border:    '#2A0A1A',
    description: 'Red, white & bass',
  },

  // ── June: Pride Month / Summer Begins ───────────────────────────────────
  pride: {
    name: 'Pride',
    emoji: '🏳️‍🌈',
    months: [6],
    primary:   '#FF44AA',   // hot pink
    secondary: '#44DDFF',   // sky blue
    tertiary:  '#AAFF44',   // lime
    highlight: '#FFAA00',
    bg3:       '#0A050A',
    border:    '#2A1A2A',
    description: 'Celebrate loud & proud',
  },

  // ── July: Independence Day ───────────────────────────────────────────────
  july4th: {
    name: 'Independence Day',
    emoji: '🎇',
    months: [7],
    primary:   '#FF2222',   // red
    secondary: '#4477FF',   // blue
    tertiary:  '#EEEEFF',   // near-white
    highlight: '#FF6600',
    bg3:       '#080010',
    border:    '#1A0A2A',
    description: 'Fireworks on the dance floor',
  },

  // ── August: Summer Peak ──────────────────────────────────────────────────
  summer: {
    name: 'Summer',
    emoji: '☀️',
    months: [8],
    primary:   '#FF8800',   // hot orange
    secondary: '#FFDD00',   // sunflower yellow
    tertiary:  '#FF4400',   // flame red
    highlight: '#FF8800',
    bg3:       '#0F0800',
    border:    '#2A1A0A',
    description: 'Peak season energy',
  },

  // ── September: Fall Begins ───────────────────────────────────────────────
  fall: {
    name: 'Fall',
    emoji: '🍂',
    months: [9],
    primary:   '#DD6600',   // amber
    secondary: '#CC4400',   // rust
    tertiary:  '#884400',   // brown-gold
    highlight: '#FFAA22',
    bg3:       '#0F0800',
    border:    '#2A1500',
    description: 'Autumn underground vibes',
  },

  // ── October: Halloween ───────────────────────────────────────────────────
  halloween: {
    name: 'Halloween',
    emoji: '🎃',
    months: [10],
    primary:   '#FF6600',   // orange
    secondary: '#CC00FF',   // electric purple
    tertiary:  '#FF2200',   // blood red
    highlight: '#FF6600',
    bg3:       '#080008',
    border:    '#2A0A2A',
    description: 'The most wicked night of the year',
  },

  // ── November: Thanksgiving / Veterans Day ───────────────────────────────
  thanksgiving: {
    name: 'Thanksgiving',
    emoji: '🦃',
    months: [11],
    primary:   '#CC7700',   // burnt orange
    secondary: '#DDAA44',   // harvest gold
    tertiary:  '#885522',   // deep brown
    highlight: '#CC7700',
    bg3:       '#0C0800',
    border:    '#2A1800',
    description: 'Grateful for every drop',
  },

  // ── December: Christmas / Winter ─────────────────────────────────────────
  winter: {
    name: 'Winter',
    emoji: '❄️',
    months: [12],
    primary:   '#CC0022',   // christmas red
    secondary: '#00CCAA',   // icy teal
    tertiary:  '#006633',   // forest green
    highlight: '#FFD700',   // gold star
    bg3:       '#00080A',
    border:    '#0A1A1A',
    description: 'Ice cold beats, warm crowd',
  },
};

// ─── Active Theme Resolver ───────────────────────────────────────────────────

/**
 * Returns the active theme object for the given date (defaults to today).
 * Dev override: add ?theme=halloween (or any key from THEMES) to the URL.
 */
export function getActiveTheme(date = new Date()) {
  // Dev/preview override via URL query param
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('theme');
    if (override && THEMES[override]) return { key: override, ...THEMES[override] };
  }

  const month = date.getMonth() + 1; // 1–12

  const entry = Object.entries(THEMES).find(([, theme]) =>
    theme.months.includes(month)
  );

  if (entry) return { key: entry[0], ...entry[1] };

  // Fallback: default RESONANCE palette (should never hit this with full 12-month coverage)
  return {
    key: 'default',
    name: 'RESONANCE',
    emoji: '◈',
    primary:   '#CC0088',
    secondary: '#00FFFF',
    tertiary:  '#9900FF',
    highlight: '#FF6600',
    bg3:       '#1A0A1A',
    border:    '#2A1A2A',
    description: 'The original frequency',
  };
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/**
 * useSeasonalTheme()
 *
 * Call once at the App root. Reads the current date, resolves the active theme,
 * and injects CSS custom properties onto :root. All existing var(--magenta) etc.
 * throughout the app instantly update — no other component changes needed.
 *
 * Returns the active theme object so callers can display the theme name/emoji.
 */
export function useSeasonalTheme() {
  const theme = getActiveTheme();

  useEffect(() => {
    const root = document.documentElement;

    // Override the 4 accent colors
    root.style.setProperty('--magenta', theme.primary);
    root.style.setProperty('--cyan',    theme.secondary);
    root.style.setProperty('--purple',  theme.tertiary);
    root.style.setProperty('--orange',  theme.highlight);

    // Tint the darkest card bg and border color
    root.style.setProperty('--bg3',   theme.bg3);
    root.style.setProperty('--border', theme.border);

    // Also update the gradient glow used in hero sections
    root.style.setProperty('--glow-primary', `${theme.primary}44`);
    root.style.setProperty('--glow-secondary', `${theme.secondary}33`);

    // Store theme key in localStorage so other components can read it
    try {
      localStorage.setItem('rsn_theme_key', theme.key);
      localStorage.setItem('rsn_theme_name', theme.name);
      localStorage.setItem('rsn_theme_emoji', theme.emoji);
    } catch (_) {}

    // Cleanup: restore defaults when component unmounts (dev only)
    return () => {
      root.style.removeProperty('--magenta');
      root.style.removeProperty('--cyan');
      root.style.removeProperty('--purple');
      root.style.removeProperty('--orange');
      root.style.removeProperty('--bg3');
      root.style.removeProperty('--border');
      root.style.removeProperty('--glow-primary');
      root.style.removeProperty('--glow-secondary');
    };
  }, [theme.key]);

  return theme;
}

// ─── Utility: get theme for any month ────────────────────────────────────────

/** Returns the theme for a given month number (1–12). Useful for admin previews. */
export function getThemeForMonth(month) {
  return Object.entries(THEMES)
    .map(([key, t]) => ({ key, ...t }))
    .find((t) => t.months.includes(month)) || getActiveTheme();
}

/** Array of all themes in calendar order — for admin theme preview grids. */
export const ALL_THEMES_ORDERED = Object.entries(THEMES)
  .sort(([, a], [, b]) => a.months[0] - b.months[0])
  .map(([key, theme]) => ({ key, ...theme }));
