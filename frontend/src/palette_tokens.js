export const PALETTE = {
  // ── Raw gradient stops ──────────────────────────────────────
  violet:       '#6E01F4',   // stop 1 — deepest violet
  violet2:      '#8A00F3',   // stop 2
  violet3:      '#A200F3',   // stop 3
  purple:       '#B100E7',   // stop 4
  purpleMid:    '#BC00DD',   // stop 5 — midpoint
  magenta:      '#C400D7',   // stop 6
  magenta2:     '#D300D0',   // stop 7
  deepPink:     '#DB00B6',   // stop 8
  hotPink:      '#E500A3',   // stop 9
  vividPink:    '#F2008A',   // stop 10 — vivid end

  // ── Light tints (backgrounds / hover fills) ─────────────────
  violetTint:   '#F5E6FF',   // very light lavender
  violetLight:  '#E8CCFF',   // light violet
  pinkTint:     '#FFE6F4',   // very light pink
  pinkLight:    '#FFF0FA',   // softest pink

  // ── Neutrals ────────────────────────────────────────────────
  white:        '#FFFFFF',
  cream:        '#FEFAFB',
  blush:        '#FDF4FF',   // slightly violet-tinted white
  slate:        '#2C3E50',
  slateMid:     '#546A7B',
  slateLight:   '#8FA3B1',

  // ── Status (keep medically meaningful) ──────────────────────
  successDark:  '#2D7A4F',
  successMid:   '#5A8A72',
  successLight: '#EBF4EF',
  successBorder:'#A8D5B8',
  warningDark:  '#9A6B1A',
  warningMid:   '#D4924A',
  warningLight: '#FDF3E7',
  warningBorder:'#F5C97B',
  dangerDark:   '#8A00F3',
  dangerLight:  '#F5E6FF',
  dangerBorder: '#E8CCFF',
};

export const GRAD = {
  // Main brand gradient (full spectrum)
  main:    'linear-gradient(135deg, #6E01F4 0%, #BC00DD 50%, #F2008A 100%)',
  // Softer version (buttons, interactive elements)
  soft:    'linear-gradient(135deg, #8A00F3 0%, #D300D0 100%)',
  // Vivid version (hero headers, emphasis)
  vivid:   'linear-gradient(135deg, #6E01F4 0%, #F2008A 100%)',
  // Dark header version (login panel, page heroes)
  header:  'linear-gradient(160deg, #2D0060 0%, #8A00F3 45%, #F2008A 100%)',
  // Very subtle (section backgrounds)
  subtle:  'linear-gradient(135deg, #F5E6FF 0%, #FFE6F4 100%)',
  // Horizontal (progress bars, loading)
  horiz:   'linear-gradient(90deg, #8A00F3 0%, #D300D0 50%, #F2008A 100%)',
};

export const SHADOW = {
  sm:   '0 2px 10px rgba(110, 1, 244, 0.08)',
  md:   '0 8px 32px rgba(110, 1, 244, 0.14)',
  lg:   '0 20px 60px rgba(110, 1, 244, 0.18)',
  glow: '0 0 24px rgba(177, 0, 231, 0.4)',
  btn:  '0 4px 20px rgba(110, 1, 244, 0.35)',
  btnHover: '0 6px 28px rgba(110, 1, 244, 0.5)',
};

// ── Convenience: CSS-in-JS colour for focus rings ────────────
export const FOCUS_RING = '0 0 0 3px rgba(177, 0, 231, 0.18)';

// ── Trimester colours (violet scale) ────────────────────────
export const TRIM_COLORS = {
  1: { color: '#8A00F3', bg: '#F0E6FF', border: '#C89EF5', emoji: '🌱', label: '1st Trimester' },
  2: { color: '#BC00DD', bg: '#F5E0FF', border: '#DBA0F0', emoji: '🌷', label: '2nd Trimester' },
  3: { color: '#E500A3', bg: '#FFE6F7', border: '#F0A0D8', emoji: '🌸', label: '3rd Trimester' },
};