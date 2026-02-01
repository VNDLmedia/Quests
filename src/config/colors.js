// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - CENTRALIZED COLOR PALETTE
// Extracted from brand flyer: Deep navy + golden orange accents
// ═══════════════════════════════════════════════════════════════════════════

export const PALETTE = {
  // Core brand colors
  navy: {
    darkest: '#080F1A',    // Deep background
    dark: '#0D1B2A',       // Primary background
    medium: '#1B2838',     // Card backgrounds
    light: '#243447',      // Elevated surfaces
    muted: '#2D4156',      // Subtle borders
  },
  
  gold: {
    bright: '#E8B84A',     // Primary accent
    warm: '#D4A53D',       // Buttons, highlights
    deep: '#C49432',       // Hover states
    muted: '#8B7355',      // Subtle accents
    glow: 'rgba(232, 184, 74, 0.3)', // Glow effects
  },
  
  cyan: {
    bright: '#5DADE2',     // Secondary accent
    muted: '#4A90B8',      // Links, icons
    deep: '#2E6B8A',       // Subtle backgrounds
    glow: 'rgba(93, 173, 226, 0.2)', // Glow effects
  },
  
  text: {
    primary: '#FFFFFF',
    secondary: '#B8C5D3',
    muted: '#6B7D8F',
    inverse: '#0D1B2A',
  },
  
  functional: {
    success: '#2ECC71',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#5DADE2',
  },
};

// Export semantic color tokens for the app
export const COLORS = {
  // Backgrounds
  background: PALETTE.navy.dark,
  backgroundDark: PALETTE.navy.darkest,
  surface: PALETTE.navy.medium,
  surfaceElevated: PALETTE.navy.light,
  
  // Glass effects (for dark mode)
  glass: {
    white: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(13, 27, 42, 0.9)',
    whiteBorder: 'rgba(255, 255, 255, 0.12)',
    darkBorder: 'rgba(255, 255, 255, 0.08)',
    glow: PALETTE.gold.glow,
  },
  
  // Brand
  primary: PALETTE.gold.bright,
  primaryDark: PALETTE.gold.deep,
  primaryLight: PALETTE.gold.glow,
  
  secondary: PALETTE.cyan.bright,
  secondaryDark: PALETTE.cyan.deep,
  secondaryLight: PALETTE.cyan.glow,
  
  accent: PALETTE.gold.warm,
  
  // Text
  text: PALETTE.text,
  
  // Functional
  success: PALETTE.functional.success,
  warning: PALETTE.functional.warning,
  error: PALETTE.functional.error,
  info: PALETTE.functional.info,
  
  // Borders
  border: PALETTE.navy.muted,
  borderLight: 'rgba(255, 255, 255, 0.1)',
  
  // Gradients
  gradients: {
    primary: [PALETTE.gold.bright, PALETTE.gold.deep],
    gold: [PALETTE.gold.bright, PALETTE.gold.warm],
    cyan: [PALETTE.cyan.bright, PALETTE.cyan.muted],
    premium: [PALETTE.navy.dark, PALETTE.navy.darkest],
    hero: ['rgba(232, 184, 74, 0.15)', 'rgba(13, 27, 42, 0.0)', PALETTE.navy.dark],
    card: [PALETTE.navy.medium, PALETTE.navy.dark],
  },
  
  // Crowd indicators
  crowd: {
    low: PALETTE.functional.success,
    medium: PALETTE.functional.warning,
    high: PALETTE.functional.error,
  },
  
  // Map specific
  map: {
    background: PALETTE.navy.darkest,
    water: '#0A1628',
    land: PALETTE.navy.dark,
    roads: PALETTE.navy.light,
    buildings: PALETTE.navy.medium,
    labels: PALETTE.text.muted,
    player: PALETTE.gold.bright,
    quest: PALETTE.cyan.bright,
    activeQuest: PALETTE.gold.warm,
    interactionRadius: PALETTE.gold.glow,
  },
};

export default COLORS;
