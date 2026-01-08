// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Quest Templates & Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Quest types
export const QUEST_TYPES = {
  location: { id: 'location', name: 'Location', icon: 'location', color: '#0D9488' },
  timed: { id: 'timed', name: 'Speed Run', icon: 'stopwatch', color: '#EF4444' },
  collect: { id: 'collect', name: 'Collection', icon: 'layers', color: '#8B5CF6' },
  social: { id: 'social', name: 'Social', icon: 'people', color: '#EC4899' },
  daily: { id: 'daily', name: 'Daily', icon: 'calendar', color: '#F59E0B' },
  challenge: { id: 'challenge', name: 'Challenge', icon: 'flag', color: '#3B82F6' },
};

// Difficulty levels
export const DIFFICULTY = {
  easy: { level: 1, name: 'Easy', color: '#10B981', xpMultiplier: 1.0 },
  medium: { level: 2, name: 'Medium', color: '#F59E0B', xpMultiplier: 1.5 },
  hard: { level: 3, name: 'Hard', color: '#EF4444', xpMultiplier: 2.0 },
};

// Europark locations (real coordinates)
export const EUROPARK_LOCATIONS = {
  main_entrance: { 
    id: 'main_entrance', 
    name: 'Main Entrance', 
    lat: 47.8224, 
    lng: 13.0456,
    radius: 50 // meters
  },
  food_court: { 
    id: 'food_court', 
    name: 'Food Court', 
    lat: 47.8229, 
    lng: 13.0461,
    radius: 30
  },
  starbucks: { 
    id: 'starbucks', 
    name: 'Starbucks', 
    lat: 47.8236, 
    lng: 13.0466,
    radius: 20
  },
  nike_store: { 
    id: 'nike_store', 
    name: 'Nike Store', 
    lat: 47.8220, 
    lng: 13.0470,
    radius: 25
  },
  zara: { 
    id: 'zara', 
    name: 'Zara', 
    lat: 47.8232, 
    lng: 13.0452,
    radius: 25
  },
  cinema: { 
    id: 'cinema', 
    name: 'Cineplexx', 
    lat: 47.8215, 
    lng: 13.0448,
    radius: 40
  },
  fountain: { 
    id: 'fountain', 
    name: 'Central Fountain', 
    lat: 47.8226, 
    lng: 13.0458,
    radius: 15
  },
  rooftop: { 
    id: 'rooftop', 
    name: 'Rooftop Terrace', 
    lat: 47.8240, 
    lng: 13.0455,
    radius: 35
  },
};

// Quest templates
export const QUEST_TEMPLATES = {
  // ═══════════════════════════════════════════════════════════════════════════
  // DAILY QUESTS (rotate daily)
  // ═══════════════════════════════════════════════════════════════════════════
  daily_coffee: {
    key: 'daily_coffee',
    type: 'location',
    category: 'daily',
    title: 'Coffee Run',
    description: 'Visit Starbucks to grab your morning energy.',
    briefing: 'Nothing starts the day better than a good coffee. Head to Starbucks and check in!',
    icon: 'cafe',
    color: '#10B981',
    xpReward: 150,
    difficulty: 'easy',
    target: 1,
    location: 'starbucks',
    expiresIn: 24 * 60 * 60 * 1000, // 24 hours
  },
  daily_steps: {
    key: 'daily_steps',
    type: 'collect',
    category: 'daily',
    title: 'Daily Walker',
    description: 'Walk around Europark.',
    briefing: 'Explore the mall! Walk at least 1km to complete this quest.',
    icon: 'walk',
    color: '#0D9488',
    xpReward: 200,
    difficulty: 'easy',
    target: 1000, // meters
    expiresIn: 24 * 60 * 60 * 1000,
  },
  daily_visit: {
    key: 'daily_visit',
    type: 'collect',
    category: 'daily',
    title: 'Explorer',
    description: 'Visit 3 different locations.',
    briefing: 'Discover new corners! Check in at 3 different locations today.',
    icon: 'compass',
    color: '#3B82F6',
    xpReward: 250,
    difficulty: 'medium',
    target: 3,
    expiresIn: 24 * 60 * 60 * 1000,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMED QUESTS (Speed Runs)
  // ═══════════════════════════════════════════════════════════════════════════
  speed_starbucks: {
    key: 'speed_starbucks',
    type: 'timed',
    category: 'challenge',
    title: 'Espresso Speed Run',
    description: 'Reach Starbucks before the timer runs out!',
    briefing: 'Race against time! Get to Starbucks in under 10 minutes from your current location.',
    icon: 'flash',
    color: '#EF4444',
    xpReward: 300,
    difficulty: 'medium',
    target: 1,
    location: 'starbucks',
    timeLimit: 10 * 60 * 1000, // 10 minutes
  },
  speed_fountain: {
    key: 'speed_fountain',
    type: 'timed',
    category: 'challenge',
    title: 'Fountain Dash',
    description: 'Sprint to the central fountain!',
    briefing: 'A quick challenge - reach the fountain in 5 minutes!',
    icon: 'water',
    color: '#3B82F6',
    xpReward: 200,
    difficulty: 'easy',
    target: 1,
    location: 'fountain',
    timeLimit: 5 * 60 * 1000,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STORY QUESTS (Multi-step adventures)
  // ═══════════════════════════════════════════════════════════════════════════
  golden_compass: {
    key: 'golden_compass',
    type: 'collect',
    category: 'story',
    title: 'The Golden Compass',
    description: 'Find the hidden QR code behind the fountain.',
    briefing: 'Legends say a golden compass is hidden near the central water fountain. Scan it to reveal the treasure map.',
    icon: 'compass',
    color: '#8B5CF6',
    xpReward: 500,
    difficulty: 'hard',
    target: 1,
    location: 'fountain',
    requiresScan: true,
  },
  fashionista: {
    key: 'fashionista',
    type: 'collect',
    category: 'story',
    title: 'Fashionista',
    description: 'Visit 3 fashion stores.',
    briefing: 'Check out the new collections at Zara, Nike, and more to complete this stylish challenge.',
    icon: 'shirt',
    color: '#EC4899',
    xpReward: 350,
    difficulty: 'medium',
    target: 3,
    locations: ['zara', 'nike_store'],
  },
  movie_night: {
    key: 'movie_night',
    type: 'location',
    category: 'story',
    title: 'Movie Night',
    description: 'Visit the cinema.',
    briefing: 'Time for some entertainment! Head to Cineplexx and check in.',
    icon: 'film',
    color: '#1E293B',
    xpReward: 200,
    difficulty: 'easy',
    target: 1,
    location: 'cinema',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL QUESTS
  // ═══════════════════════════════════════════════════════════════════════════
  social_scan: {
    key: 'social_scan',
    type: 'social',
    category: 'social',
    title: 'NPC Recruitment',
    description: 'Scan another player\'s QR code.',
    briefing: 'Find another PULSE player and scan their profile QR code to add them as a friend!',
    icon: 'qr-code',
    color: '#EC4899',
    xpReward: 300,
    difficulty: 'medium',
    target: 1,
  },
  team_challenge: {
    key: 'team_challenge',
    type: 'social',
    category: 'social',
    title: 'Team Up',
    description: 'Complete a quest while near a friend.',
    briefing: 'Team work makes the dream work! Complete any quest while within 50m of a friend.',
    icon: 'people',
    color: '#EC4899',
    xpReward: 400,
    difficulty: 'medium',
    target: 1,
  },
};

// Get daily quests for today
export const getDailyQuests = () => {
  const dailyKeys = ['daily_coffee', 'daily_steps', 'daily_visit'];
  return dailyKeys.map(key => ({
    ...QUEST_TEMPLATES[key],
    isDaily: true,
    generatedAt: new Date().toDateString(),
  }));
};

// Get random quest from templates
export const getRandomQuest = (excludeKeys = []) => {
  const available = Object.values(QUEST_TEMPLATES)
    .filter(q => !excludeKeys.includes(q.key) && q.category !== 'daily');
  
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
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

// Check if user is within location radius
export const isWithinLocation = (userLat, userLng, locationId) => {
  const location = EUROPARK_LOCATIONS[locationId];
  if (!location) return false;
  
  const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
  return distance <= location.radius;
};

export default {
  QUEST_TYPES,
  DIFFICULTY,
  EUROPARK_LOCATIONS,
  QUEST_TEMPLATES,
  getDailyQuests,
  getRandomQuest,
  calculateDistance,
  isWithinLocation,
};

