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

    // Store all quest data in a JSON-safe format
    const questMetadata = {
      lat: location.latitude,
      lng: location.longitude,
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

export default {
  getCurrentLocation,
  validateQRCode,
  createQuest,
  getAvailableIcons,
};
