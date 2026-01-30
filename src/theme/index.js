// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - CLEAN MODERN CI
// ═══════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const BRAND = {
  name: 'Ethernal Paths',
  tagline: 'Your Adventure Awaits',
  fullName: 'Ethernal Paths',
};

export const COLORS = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  
  // Glass (for GlassCard/GlassButton)
  glass: {
    white: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(15, 23, 42, 0.8)',
    whiteBorder: 'rgba(255, 255, 255, 0.3)',
    darkBorder: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Brand
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  
  secondary: '#0F172A',
  
  // Accents
  accent: '#0D9488',
  gold: '#D97706',
  purple: '#9333EA',
  pink: '#DB2777',
  
  // Text
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  
  // Functional
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Borders
  border: '#E2E8F0',
  
  // Gradients
  gradients: {
    primary: ['#4F46E5', '#4338CA'],
    card: ['#FFFFFF', '#F8FAFC'],
    gold: ['#F59E0B', '#D97706'],
    premium: ['#1E1B4B', '#312E81'],
    royal: ['#7E22CE', '#6B21A8'],
  },
  
  crowd: {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  }
};

export const CATEGORIES = {
  daily: { id: 'daily', label: 'Daily', icon: 'calendar', color: '#4F46E5' },
  explore: { id: 'explore', label: 'Explore', icon: 'compass', color: '#0D9488' },
  shop: { id: 'shop', label: 'Shopping', icon: 'bag', color: '#EC4899' },
  food: { id: 'food', label: 'Taste', icon: 'restaurant', color: '#F59E0B' },
};

export const REWARDS = {
  levels: [
    { name: 'Starter', minPoints: 0, color: '#94A3B8', next: 500 },
    { name: 'Insider', minPoints: 500, color: '#4F46E5', next: 1500 },
    { name: 'Elite', minPoints: 1500, color: '#0F172A', next: 5000 },
    { name: 'Legend', minPoints: 5000, color: '#D97706', next: 10000 },
  ],
};

// Web-compatible shadows using boxShadow
const webShadows = {
  sm: { boxShadow: '0px 1px 2px rgba(100, 116, 139, 0.05)' },
  md: { boxShadow: '0px 4px 12px rgba(100, 116, 139, 0.08)' },
  lg: { boxShadow: '0px 8px 24px rgba(100, 116, 139, 0.12)' },
  xl: { boxShadow: '0px 12px 32px rgba(100, 116, 139, 0.15)' },
};

// Native shadows
const nativeShadows = {
  sm: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  lg: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  xl: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 10 },
};

export const SHADOWS = Platform.OS === 'web' ? webShadows : nativeShadows;

// Add soft shadow for glass components
SHADOWS.soft = Platform.OS === 'web' 
  ? { boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)' }
  : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 32, elevation: 5 };

// Alias for backwards compatibility (some components use 'medium' instead of 'md')
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

// Typography
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};

// Achievement Colors
export const ACHIEVEMENT_COLORS = {
  common: { bg: '#F1F5F9', text: '#94A3B8', border: '#E2E8F0' },
  uncommon: { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0' },
  rare: { bg: '#EFF6FF', text: '#3B82F6', border: '#93C5FD' },
  epic: { bg: '#F5F3FF', text: '#8B5CF6', border: '#C4B5FD' },
  legendary: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
};

// Game UI Colors
export const GAME_COLORS = {
  xp: '#F59E0B',
  streak: '#EF4444',
  level: '#8B5CF6',
  quest: '#0D9488',
  challenge: '#EC4899',
  social: '#3B82F6',
};

// Layout Constants for consistent spacing
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

// Common Styles for reuse
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

export default { BRAND, COLORS, CATEGORIES, REWARDS, SHADOWS, RADII, TYPOGRAPHY, ACHIEVEMENT_COLORS, GAME_COLORS, LAYOUT, COMMON_STYLES };
