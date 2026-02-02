// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Quest Utilities
// ═══════════════════════════════════════════════════════════════════════════

// Quest types
export const QUEST_TYPES = {
  location: { id: 'location', name: 'Location', icon: 'location', color: '#0D9488' },
  timed: { id: 'timed', name: 'Speed Run', icon: 'stopwatch', color: '#EF4444' },
  collect: { id: 'collect', name: 'Collection', icon: 'layers', color: '#8B5CF6' },
  social: { id: 'social', name: 'Social', icon: 'people', color: '#EC4899' },
  daily: { id: 'daily', name: 'Daily', icon: 'calendar', color: '#F59E0B' },
  challenge: { id: 'challenge', name: 'Challenge', icon: 'flag', color: '#3B82F6' },
  poi: { id: 'poi', name: 'Point of Interest', icon: 'star', color: '#E8B84A' },
};

// Difficulty levels
export const DIFFICULTY = {
  easy: { level: 1, name: 'Easy', color: '#10B981', xpMultiplier: 1.0 },
  medium: { level: 2, name: 'Medium', color: '#F59E0B', xpMultiplier: 1.5 },
  hard: { level: 3, name: 'Hard', color: '#EF4444', xpMultiplier: 2.0 },
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Helper for daily quests (now generated dynamically)
// Kept for backward compatibility if needed by other components
export const getDailyQuests = () => {
  // Now returns empty as they should come from DB
  return [];
};

// Check if user is within location radius
// Note: This relies on locations being passed in, or it will fail if locations are expected to be hardcoded
// We'll update it to accept a location object or use the fetched locations context if possible.
// For now, let's make it a pure function that takes the target location coordinates and radius.
export const isWithinLocation = (userLat, userLng, targetLat, targetLng, radius = 20) => {
  if (!userLat || !userLng || !targetLat || !targetLng) return false;
  
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radius;
};

export default {
  QUEST_TYPES,
  DIFFICULTY,
  calculateDistance,
  getDailyQuests,
  isWithinLocation,
};
