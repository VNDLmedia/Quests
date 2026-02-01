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
  console.log('getCurrentLocation called, Platform:', Platform.OS);
  
  try {
    if (Platform.OS === 'web') {
      console.log('Using web geolocation');
      // Web geolocation
      return new Promise((resolve, reject) => {
        if (!navigator?.geolocation) {
          console.error('Geolocation not available');
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        console.log('Requesting location from browser...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location success:', position.coords);
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
      console.log('Using native expo-location');
      // Native location using expo-location
      const LocationModule = await import('expo-location');
      const Location = LocationModule.default || LocationModule;
      
      console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('Native location success:', location.coords);
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
  try {
    if (!qrCodeId || qrCodeId.trim() === '') {
      return { valid: false, error: 'QR code cannot be empty' };
    }

    // Check if this QR code is already used in any quest
    const { data: existingQuests, error } = await supabase
      .from('quests')
      .select('id, title, metadata')
      .eq('metadata->>qr_code_id', qrCodeId)
      .eq('is_active', true);

    if (error) {
      console.error('Error validating QR code:', error);
      return { valid: false, error: error.message };
    }

    if (existingQuests && existingQuests.length > 0) {
      return {
        valid: false,
        existingQuest: existingQuests[0],
        error: `This QR code is already used for quest: "${existingQuests[0].title}"`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating QR code:', error);
    return { valid: false, error: error.message };
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
    } = questData;

    // Validate required fields
    if (!title || !icon || !category || !location || !qrCodeId || !adminId) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Prepare quest object for database
    const newQuest = {
      title: title.trim(),
      description: description?.trim() || null,
      type: 'explore',
      category: category, // team color: blue, yellow, green, purple
      icon: icon,
      xp_reward: xpReward,
      gem_reward: gemReward,
      target_value: 1,
      requires_scan: true,
      is_active: true,
      location_id: null, // We're not using the locations table
      metadata: {
        lat: location.latitude,
        lng: location.lng,
        qr_code_id: qrCodeId,
        created_by_admin: true,
        admin_id: adminId,
        created_at: new Date().toISOString(),
      },
    };

    // Insert quest into database
    const { data, error } = await supabase
      .from('quests')
      .insert([newQuest])
      .select()
      .single();

    if (error) {
      console.error('Error creating quest:', error);
      return {
        success: false,
        error: error.message,
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
