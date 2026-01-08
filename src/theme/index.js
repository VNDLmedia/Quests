// ═══════════════════════════════════════════════════════════════════════════
// PULSE - CLEAN MODERN CI
// ═══════════════════════════════════════════════════════════════════════════

export const BRAND = {
  name: 'PULSE',
  tagline: 'Europark Experience',
  fullName: 'Europark PULSE',
};

export const COLORS = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  
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

export const SHADOWS = {
  sm: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  lg: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  xl: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 10 },
};

export default { BRAND, COLORS, CATEGORIES, REWARDS, SHADOWS };
