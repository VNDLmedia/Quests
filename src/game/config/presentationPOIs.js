// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Hardcoded Presentation POI Data
// Points of Interest for presentation/demo mode
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hardcoded POI data mapped by QR code ID
 * When a user scans one of these QR codes, they see the corresponding content
 */
export const PRESENTATION_POI_DATA = {
  // AI-Guided Routes
  'ID155': {
    headline: 'The End of the Argument: AI-Guided Routes',
    hook: 'Stop fighting over the paper map.',
    story: "We've all been there—standing at a crossroads, arguing over where to go next. Our AI routing agent ends the debate by generating a custom path based on your specific interests and favorite attractions. It's not just a map; it's your personal concierge.",
    image: '4.jpeg',
  },

  // Intensity Slider
  'ID002': {
    headline: 'Dial Your Reality: The Intensity Slider',
    hook: 'Are you a "Tourist" or a "Hero"?.',
    story: 'Some guests want the fastest route to coffee; others want an epic quest. With our unique "Intensity Slider," you control the interface. Slide it down for pure, efficient navigation; slide it up to reveal a hidden world of digital treasures and pixel-art challenges layered over your surroundings.',
    image: '1.jpeg',
  },

  // Automated Logistics
  'ID013': {
    headline: 'The Invisible Wait: Automated Logistics',
    hook: 'What if the "line" didn\'t exist?.',
    story: 'Standing in a hot, static queue is a thing of the past. Our integrated logistics allow you to join a "Virtual Line" or book a restaurant table directly within the digital map. You spend your time exploring the park, not staring at the back of someone\'s head.',
    image: '3.jpeg',
  },

  // Inclusive Navigation
  'ID047': {
    headline: 'Seeing with Sound: Inclusive Navigation',
    hook: 'Experience independence, regardless of sight.',
    story: "Complexity shouldn't be a barrier. By pairing our platform with smart audio glasses, we provide high-fidelity, voice-guided navigation for visitors with visual impairments. We ensure every guest, regardless of ability, can navigate the world with confidence and dignity.",
    image: '10.jpeg',
  },

  // 365-Day Park
  'ID038': {
    headline: 'The 365-Day Park: The Sofa-to-Ride Loop',
    hook: "The magic doesn't end at the exit gate.",
    story: "Why wait for your visit to start the fun? Guests can explore the digital twin from their sofa, playing ride-specific pixel games to earn high scores and rewards before they even arrive. We turn a one-day visit into a year-round engagement.",
    image: '16.jpeg',
  },

  // Real-Time Responsiveness
  'ID109': {
    headline: 'A Living World: Real-Time Responsiveness',
    hook: 'The map that reacts to the clouds.',
    story: 'If it starts to rain or a ride goes down, a static map becomes useless. Eternal Path updates instantly, pushing "Rainy Day Quests" to indoor locations and rerouting guests to ensure their experience stays positive, no matter the circumstances.',
    image: '5.jpeg',
  },

  // High-Fidelity Insights
  'ID097': {
    headline: 'Predicting Smiles: High-Fidelity Insights',
    hook: 'See the park through the eyes of thousands.',
    story: 'We capture a goldmine of anonymized movement data to see exactly how guests interact with your space. Operators use these simulations to identify bottlenecks before they happen, optimizing future layouts for maximum joy and revenue.',
    image: '3.jpeg',
  },

  // B2B2C Quest Engine
  'ID063': {
    headline: 'The Brand Adventure: B2B2C Quest Engine',
    hook: 'Turn sponsors into storytellers.',
    story: "Don't just show an ad; create an adventure. Our platform allows partners and sponsors to \"drop\" quests that lead guests directly to their storefronts. It's a win-win: guests get a fun challenge, and partners get high-intent foot traffic.",
    image: '8.jpeg',
  },

  // Digital Collectibles
  'ID062': {
    headline: 'Digital Status, Real Perks: Collectibles',
    hook: 'Trading cards with a "Golden" secret.',
    story: 'Our tiered digital trading cards turn casual visitors into lifelong collectors. But these aren\'t just pixels—high-tier cards can be redeemed for physical perks like "Queue Jumpers" or "Golden Tickets," bridging the gap between digital achievement and real-world luxury.',
    image: 'Michael Mack 2.png',
  },

  // Seasonal Branding Agility
  'ID022': {
    headline: 'Instant Magic: Seasonal Branding Agility',
    hook: 'Change the world with one click.',
    story: 'Transitioning a physical park for Halloween or Christmas takes weeks of labor. On Eternal Path, it happens in a heartbeat. We push a site-wide thematic overlay that transforms the map, the quests, and the atmosphere across every guest\'s device simultaneously.',
    image: '6.jpeg',
  },

  // 2D Strategy
  'ID087': {
    headline: 'Simplicity is a Superpower: 2D Strategy',
    hook: 'High performance, zero frustration.',
    story: '3D maps are heavy, slow, and drain batteries. We chose a vibrant, walkable 2D "pixel twin" environment because it works perfectly on every smartphone, uses minimal data, and feels like a classic video game.',
    image: '7.jpeg',
  },

  // Modular Architecture
  'ID112': {
    headline: 'Build Your Own Path: Modular Architecture',
    hook: 'Start small, dream big.',
    story: "Whether you're a museum or a massive theme park, our platform scales with you. Choose the Digital Twin Stack for navigation, then add the Collectible or Engagement stacks as your community grows. It's a modular ecosystem designed for your specific needs.",
    image: '7.jpeg',
  },

  // Hardware Agility
  'ID137': {
    headline: 'Future-Proof Reality: Hardware Agility',
    hook: 'Ready for the glasses of tomorrow.',
    story: "We aren't waiting for the future; we're building the foundation for it. Because every point of interest is already mapped on our 2D grid, the transition to AR overlays and smart glasses is seamless. Your investment today is ready for the hardware of 2027 and beyond.",
    image: '15.jpeg',
  },
};

/**
 * Get POI data by QR code ID
 * @param {string} qrCodeId - The scanned QR code ID (e.g., "ID155", "ID002")
 * @returns {Object|null} POI data object or null if not found
 */
export const getHardcodedPOI = (qrCodeId) => {
  if (!qrCodeId) return null;
  
  // Normalize to uppercase for consistent matching
  const normalizedId = qrCodeId.toUpperCase().trim();
  
  const poi = PRESENTATION_POI_DATA[normalizedId];
  
  if (!poi) return null;
  
  // Return formatted POI data compatible with POIModal component
  return {
    id: normalizedId,
    qrCodeId: normalizedId,
    name: poi.headline,
    infoTitle: poi.headline,
    infoText: poi.story,
    infoImageUrl: `/poi/${poi.image}`,
    hook: poi.hook,
    // No video for these hardcoded POIs
    videoUrl: null,
  };
};

/**
 * Check if a QR code ID matches a hardcoded POI
 * @param {string} qrCodeId - The QR code ID to check
 * @returns {boolean} True if this is a hardcoded POI
 */
export const isHardcodedPOI = (qrCodeId) => {
  if (!qrCodeId) return false;
  const normalizedId = qrCodeId.toUpperCase().trim();
  return normalizedId in PRESENTATION_POI_DATA;
};

/**
 * Get all hardcoded POI IDs
 * @returns {string[]} Array of all POI QR code IDs
 */
export const getAllHardcodedPOIIds = () => {
  return Object.keys(PRESENTATION_POI_DATA);
};

export default {
  PRESENTATION_POI_DATA,
  getHardcodedPOI,
  isHardcodedPOI,
  getAllHardcodedPOIIds,
};
