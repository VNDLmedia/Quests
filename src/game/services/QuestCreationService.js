// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Quest Creation Service (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { supabase } from '../../config/supabase';

/**
 * Get current GPS location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = async () => {
  // console.log('getCurrentLocation called, Platform:', Platform.OS);
  
  try {
    if (Platform.OS === 'web') {
      // console.log('Using web geolocation');
      // Web geolocation
      return new Promise((resolve, reject) => {
        if (!navigator?.geolocation) {
          console.error('Geolocation not available');
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        // console.log('Requesting location from browser...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // console.log('Location success:', position.coords);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            let errorMsg = 'Unable to get location';
            switch(error.code) {
              case 1: errorMsg = 'Location permission denied'; break;
              case 2: errorMsg = 'Location unavailable'; break;
              case 3: errorMsg = 'Location request timeout'; break;
            }
            reject(new Error(errorMsg));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    } else {
      // console.log('Using native expo-location');
      // Native location using expo-location
      const LocationModule = await import('expo-location');
      const Location = LocationModule.default || LocationModule;
      
      // console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // console.log('Native location success:', location.coords);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * Validate if QR code is already used for another quest
 * @param {string} qrCodeId - The scanned QR code ID
 * @returns {Promise<{valid: boolean, existingQuest: object|null}>}
 */
export const validateQRCode = async (qrCodeId) => {
  // console.log('[QuestCreationService] validateQRCode called with:', qrCodeId);
  
  try {
    if (!qrCodeId || qrCodeId.trim() === '') {
      // console.log('[QuestCreationService] Empty QR code');
      return { valid: false, error: 'QR code cannot be empty' };
    }

    // console.log('[QuestCreationService] Querying database for existing quests with this QR code...');
    
    // Try to check if this QR code is already used
    // First, try the metadata column approach
    const { data: existingQuests, error } = await supabase
      .from('quests')
      .select('id, title, metadata')
      .eq('is_active', true);

    // console.log('[QuestCreationService] Query result:', { existingQuests, error });

    if (error) {
      console.error('[QuestCreationService] Database error:', error);
      // If metadata column doesn't exist, we can still proceed
      if (error.code === '42703') {
        // console.log('[QuestCreationService] Metadata column missing - assuming QR code is available');
        return { valid: true };
      }
      return { valid: false, error: error.message };
    }

    // Check manually if any quest has this QR code in metadata
    if (existingQuests && existingQuests.length > 0) {
      const duplicate = existingQuests.find(q => 
        q.metadata && q.metadata.qr_code_id === qrCodeId
      );
      
      if (duplicate) {
        // console.log('[QuestCreationService] QR code already in use');
        return {
          valid: false,
          existingQuest: duplicate,
          error: `This QR code is already used for quest: "${duplicate.title}"`,
        };
      }
    }

    // console.log('[QuestCreationService] QR code is available');
    return { valid: true };
  } catch (error) {
    console.error('[QuestCreationService] Exception:', error);
    return { valid: false, error: error.message || 'Validation failed' };
  }
};

/**
 * Create a new quest in the database
 * @param {object} questData - Quest data to insert
 * @returns {Promise<{success: boolean, quest: object|null, error: string|null}>}
 */
export const createQuest = async (questData) => {
  try {
    const {
      title,
      description,
      icon,
      xpReward,
      gemReward,
      category,
      location,
      qrCodeId,
      adminId,
      infoContent, // New: Info content to show when QR is scanned
    } = questData;

    // Validate required fields
    if (!title || !icon || !category || !location || !qrCodeId || !adminId) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Validate location has both lat and lng
    const lat = location.latitude ?? location.lat;
    const lng = location.longitude ?? location.lng;
    
    console.log('[QuestCreationService] Location data:', { 
      original: location, 
      extracted: { lat, lng } 
    });
    
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      console.error('[QuestCreationService] Invalid location - missing lat or lng:', location);
      return {
        success: false,
        error: 'Invalid location data - missing latitude or longitude',
      };
    }

    // Store all quest data in a JSON-safe format
    const questMetadata = {
      lat: lat,
      lng: lng,
      qr_code_id: qrCodeId,
      created_by_admin: true,
      admin_id: adminId,
      xp_reward: xpReward,
      gem_reward: gemReward,
      icon: icon,
      category: category,
      requires_scan: true,
      created_at: new Date().toISOString(),
    };
    
    // Add info_content to metadata if provided
    if (infoContent && (infoContent.title || infoContent.text)) {
      questMetadata.info_content = {
        title: infoContent.title || 'Info',
        text: infoContent.text || '',
        image_url: infoContent.imageUrl || null,
      };
    }

    // console.log('[QuestCreationService] Attempting to insert quest...');
    // console.log('[QuestCreationService] Quest data:', { title, description, questMetadata });

    // Try FULL insert first (all columns)
    const fullQuest = {
      title: title.trim(),
      description: description?.trim() || null,
      type: 'explore',
      category: category,
      icon: icon,
      xp_reward: xpReward,
      gem_reward: gemReward,
      target_value: 1,
      requires_scan: true,
      is_active: true,
      metadata: questMetadata,
    };

    let { data, error } = await supabase
      .from('quests')
      .insert([fullQuest])
      .select()
      .single();

    // If that fails, try with MINIMAL columns (just title + metadata)
    if (error && error.code === 'PGRST204') {
      // console.log('[QuestCreationService] Full insert failed, trying minimal insert...');
      // console.log('[QuestCreationService] Error was:', error.message);
      
      // Try with just title and description (most basic)
      const minimalQuest = {
        title: title.trim(),
      };

      // Try adding description if it exists
      const { data: descData, error: descError } = await supabase
        .from('quests')
        .insert([{ ...minimalQuest, description: description?.trim() || null }])
        .select()
        .single();

      if (!descError) {
        data = descData;
        error = null;
        // console.log('[QuestCreationService] Minimal insert succeeded!');
        // console.log('[QuestCreationService] NOTE: Run the migration SQL to add missing columns!');
      } else {
        // Even more minimal - just title
        const { data: titleData, error: titleError } = await supabase
          .from('quests')
          .insert([minimalQuest])
          .select()
          .single();

        if (!titleError) {
          data = titleData;
          error = null;
          // console.log('[QuestCreationService] Title-only insert succeeded!');
        } else {
          error = titleError;
        }
      }
    }

    if (error) {
      console.error('[QuestCreationService] Error creating quest:', error);
      console.error('[QuestCreationService] Please run the migration SQL in Supabase!');
      return {
        success: false,
        error: `${error.message}\n\nPlease run the migration SQL in Supabase Dashboard to add missing columns.`,
      };
    }

    return {
      success: true,
      quest: data,
    };
  } catch (error) {
    console.error('Error creating quest:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get list of available icons for quests
 * @returns {Array<{name: string, icon: string}>}
 */
export const getAvailableIcons = () => {
  return [
    { name: 'Compass', icon: 'compass' },
    { name: 'Flag', icon: 'flag' },
    { name: 'Star', icon: 'star' },
    { name: 'Trophy', icon: 'trophy' },
    { name: 'Map', icon: 'map' },
    { name: 'Location', icon: 'location' },
    { name: 'Target', icon: 'locate' },
    { name: 'Scan', icon: 'qr-code' },
    { name: 'Gift', icon: 'gift' },
    { name: 'Heart', icon: 'heart' },
    { name: 'Flash', icon: 'flash' },
    { name: 'Camera', icon: 'camera' },
    { name: 'Walk', icon: 'walk' },
    { name: 'Bicycle', icon: 'bicycle' },
    { name: 'Restaurant', icon: 'restaurant' },
    { name: 'Cafe', icon: 'cafe' },
  ];
};

/**
 * Create a new presentation quest (for static 2D map)
 * Position is stored as percentage coordinates (positionX, positionY)
 * @param {Object} questData - Quest data including position
 * @returns {Promise<{success: boolean, quest: object|null, error: string|null}>}
 */
export const createPresentationQuest = async (questData) => {
  try {
    const {
      title,
      description,
      icon,
      xpReward,
      gemReward,
      category,
      qrCodeId,
      adminId,
      positionX,
      positionY,
      infoContent,
      isPresentationQuest,
    } = questData;

    // Validate required fields
    if (!title || !icon || !category || !qrCodeId || !adminId) {
      return {
        success: false,
        error: 'Missing required fields (title, icon, category, qrCodeId, adminId)',
      };
    }

    // Validate position data
    if (positionX === undefined || positionY === undefined) {
      return {
        success: false,
        error: 'Missing position data (positionX, positionY)',
      };
    }

    console.log('[QuestCreationService] Creating presentation quest:', {
      title,
      positionX,
      positionY,
      qrCodeId,
    });

    // Store all quest data in metadata, including position
    const questMetadata = {
      // Position for 2D static map (percentage 0-100)
      position_x: positionX,
      position_y: positionY,
      // QR Code
      qr_code_id: qrCodeId,
      // Flags
      is_presentation_quest: true,
      created_by_admin: true,
      admin_id: adminId,
      requires_scan: true,
      // Rewards (also stored at top level, but backup here)
      xp_reward: xpReward,
      gem_reward: gemReward,
      // Styling
      icon: icon,
      category: category,
      // Timestamp
      created_at: new Date().toISOString(),
    };

    // Add info_content to metadata if provided
    if (infoContent && (infoContent.title || infoContent.text)) {
      questMetadata.info_content = {
        title: infoContent.title || 'Info',
        text: infoContent.text || '',
        image_url: infoContent.imageUrl || null,
      };
    }

    // Create quest object
    // Note: Using 'explore' type since 'presentation' is not in the allowed types
    // The is_presentation_quest flag in metadata marks it as a presentation quest
    const questToInsert = {
      title: title.trim(),
      description: description?.trim() || null,
      type: 'explore',
      category: category,
      icon: icon,
      xp_reward: xpReward || 100,
      gem_reward: gemReward || 50,
      target_value: 1,
      requires_scan: true,
      is_active: true,
      metadata: questMetadata,
    };

    const { data, error } = await supabase
      .from('quests')
      .insert([questToInsert])
      .select()
      .single();

    if (error) {
      console.error('[QuestCreationService] Error creating presentation quest:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[QuestCreationService] Presentation quest created successfully:', data.id);

    return {
      success: true,
      quest: data,
    };
  } catch (error) {
    console.error('Error creating presentation quest:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetch all presentation quests (for display on static map)
 * Presentation quests have is_presentation_quest: true in their metadata
 * @returns {Promise<{success: boolean, quests: array, error: string|null}>}
 */
export const fetchPresentationQuests = async () => {
  try {
    // Filter by metadata->is_presentation_quest = true
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('metadata->>is_presentation_quest', 'true')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[QuestCreationService] Error fetching presentation quests:', error);
      return {
        success: false,
        quests: [],
        error: error.message,
      };
    }

    // Transform quests for map display
    const transformedQuests = (data || []).map(quest => ({
      ...quest,
      // Extract position from metadata
      positionX: quest.metadata?.position_x ?? 50,
      positionY: quest.metadata?.position_y ?? 50,
      // Extract other useful fields
      qrCodeId: quest.metadata?.qr_code_id,
      infoContent: quest.metadata?.info_content,
    }));

    return {
      success: true,
      quests: transformedQuests,
    };
  } catch (error) {
    console.error('Error fetching presentation quests:', error);
    return {
      success: false,
      quests: [],
      error: error.message,
    };
  }
};

/**
 * Fetch user's progress on presentation quests only
 * @param {string} userId - User ID
 * @param {Array} presentationQuestIds - Array of presentation quest IDs to filter by
 * @returns {Promise<{success: boolean, completed: Set, active: Set, error: string|null}>}
 */
export const fetchUserPresentationQuestProgress = async (userId, presentationQuestIds = []) => {
  if (!userId) {
    return { success: false, completed: new Set(), active: new Set(), error: 'No user ID' };
  }

  try {
    // If no presentation quest IDs provided, return empty sets
    if (!presentationQuestIds || presentationQuestIds.length === 0) {
      return {
        success: true,
        completed: new Set(),
        active: new Set(),
      };
    }

    // Get user quests only for presentation quests
    const { data, error } = await supabase
      .from('user_quests')
      .select('quest_id, status')
      .eq('user_id', userId)
      .in('quest_id', presentationQuestIds);

    if (error) {
      console.error('[QuestCreationService] Error fetching user quest progress:', error);
      return {
        success: false,
        completed: new Set(),
        active: new Set(),
        error: error.message,
      };
    }

    const completed = new Set();
    const active = new Set();

    (data || []).forEach(uq => {
      if (uq.status === 'completed') {
        completed.add(uq.quest_id);
      } else if (uq.status === 'active') {
        active.add(uq.quest_id);
      }
    });

    return {
      success: true,
      completed,
      active,
    };
  } catch (error) {
    console.error('Error fetching user presentation quest progress:', error);
    return {
      success: false,
      completed: new Set(),
      active: new Set(),
      error: error.message,
    };
  }
};

export default {
  getCurrentLocation,
  validateQRCode,
  createQuest,
  createPresentationQuest,
  fetchPresentationQuests,
  fetchUserPresentationQuestProgress,
  getAvailableIcons,
};
