// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - DARK MODE THEME
// Deep navy background with golden orange accents
// ═══════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { COLORS, PALETTE } from '../config/colors';

// Re-export colors for backwards compatibility
export { COLORS, PALETTE };

export const BRAND = {
  name: 'Eternal Path',
  tagline: 'Cartographers of Reality',
  fullName: 'Eternal Path: Cartographers of Reality',
};

export const CATEGORIES = {
  daily: { id: 'daily', label: 'Daily', icon: 'calendar', color: COLORS.primary },
  explore: { id: 'explore', label: 'Explore', icon: 'compass', color: COLORS.secondary },
  shop: { id: 'shop', label: 'Shopping', icon: 'bag', color: '#EC4899' },
  food: { id: 'food', label: 'Taste', icon: 'restaurant', color: COLORS.warning },
};

export const REWARDS = {
  levels: [
    { name: 'Pathfinder', minPoints: 0, color: PALETTE.text.muted, next: 500 },
    { name: 'Cartographer', minPoints: 500, color: COLORS.secondary, next: 1500 },
    { name: 'Navigator', minPoints: 1500, color: COLORS.primary, next: 5000 },
    { name: 'Pioneer', minPoints: 5000, color: PALETTE.gold.bright, next: 10000 },
  ],
};

// Web-compatible shadows using boxShadow (dark theme optimized)
const webShadows = {
  sm: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)' },
  md: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)' },
  lg: { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.5)' },
  xl: { boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.6)' },
  glow: { boxShadow: `0px 0px 20px ${PALETTE.gold.glow}` },
  glowCyan: { boxShadow: `0px 0px 20px ${PALETTE.cyan.glow}` },
};

// Native shadows (dark theme optimized)
const nativeShadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 8 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 12 },
  glow: { shadowColor: PALETTE.gold.bright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  glowCyan: { shadowColor: PALETTE.cyan.bright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
};

export const SHADOWS = Platform.OS === 'web' ? webShadows : nativeShadows;

// Add soft shadow for glass components
SHADOWS.soft = Platform.OS === 'web' 
  ? { boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)' }
  : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 6 };

// Alias for backwards compatibility
SHADOWS.medium = SHADOWS.md;

// Border radii
export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Typography (light text on dark backgrounds)
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 40, color: COLORS.text.primary },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, color: COLORS.text.primary },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28, color: COLORS.text.primary },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, color: COLORS.text.secondary },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, color: COLORS.text.primary },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: COLORS.text.secondary },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16, color: COLORS.text.muted },
};

// Achievement Colors (dark theme)
export const ACHIEVEMENT_COLORS = {
  common: { bg: PALETTE.navy.medium, text: PALETTE.text.muted, border: PALETTE.navy.muted },
  uncommon: { bg: 'rgba(46, 204, 113, 0.15)', text: '#2ECC71', border: 'rgba(46, 204, 113, 0.3)' },
  rare: { bg: 'rgba(93, 173, 226, 0.15)', text: PALETTE.cyan.bright, border: 'rgba(93, 173, 226, 0.3)' },
  epic: { bg: 'rgba(155, 89, 182, 0.15)', text: '#9B59B6', border: 'rgba(155, 89, 182, 0.3)' },
  legendary: { bg: PALETTE.gold.glow, text: PALETTE.gold.bright, border: 'rgba(232, 184, 74, 0.4)' },
};

// Game UI Colors
export const GAME_COLORS = {
  xp: PALETTE.gold.bright,
  streak: '#E74C3C',
  level: '#9B59B6',
  quest: PALETTE.cyan.bright,
  challenge: '#EC4899',
  social: PALETTE.cyan.muted,
};

// Layout Constants
export const LAYOUT = {
  screenPadding: 20,
  cardBorderRadius: 20,
  cardPadding: 20,
  sectionGap: 24,
  tabBorderRadius: 14,
  tabPadding: 4,
  tabItemRadius: 10,
  iconSize: {
    sm: 18,
    md: 24,
    lg: 32,
  },
  avatarSize: {
    sm: 32,
    md: 44,
    lg: 70,
  },
};

// Common Styles (dark theme)
export const COMMON_STYLES = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.tabBorderRadius,
    padding: LAYOUT.tabPadding,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: LAYOUT.tabItemRadius,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
};

export default { BRAND, COLORS, PALETTE, CATEGORIES, REWARDS, SHADOWS, RADII, TYPOGRAPHY, ACHIEVEMENT_COLORS, GAME_COLORS, LAYOUT, COMMON_STYLES };
