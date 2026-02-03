// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Presentation Mode Service
// ═══════════════════════════════════════════════════════════════════════════
// Handles all presentation mode related operations

import { supabase, isSupabaseConfigured } from '../../config/supabase';

/**
 * Get current presentation mode settings
 */
export const getPresentationSettings = async () => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching presentation settings:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getPresentationSettings:', error);
    return { data: null, error };
  }
};

/**
 * Check if presentation mode is currently active
 * DISABLED: Presentation mode is completely disabled
 */
export const isPresentationModeActive = async () => {
  // Presentation mode is completely disabled
  return false;
  
  /* ORIGINAL CODE - DISABLED
  const { data: settings, error } = await getPresentationSettings();
  
  if (error || !settings) {
    return false;
  }

  // Manually activated
  if (settings.is_active) {
    return true;
  }

  // Auto-activate based on time
  if (settings.auto_activate_at) {
    const activateTime = new Date(settings.auto_activate_at);
    if (new Date() >= activateTime) {
      return true;
    }
  }

  return false;
  */
};

/**
 * Toggle presentation mode (admin only)
 */
export const togglePresentationMode = async (isActive) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_settings')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) {
      console.error('Error toggling presentation mode:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in togglePresentationMode:', error);
    return { success: false, error };
  }
};

/**
 * Update presentation settings (admin only)
 */
export const updatePresentationSettings = async (updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) {
      console.error('Error updating presentation settings:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePresentationSettings:', error);
    return { success: false, error };
  }
};

/**
 * Get all POIs for presentation mode
 */
export const getPresentationPOIs = async () => {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_pois')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching POIs:', error);
      return { data: [], error };
    }

    // Transform to match component expected format
    const pois = (data || []).map(poi => ({
      id: poi.id,
      name: poi.name,
      description: poi.description,
      positionX: poi.position_x,
      positionY: poi.position_y,
      icon: poi.icon,
      iconColor: poi.icon_color,
      qrCodeId: poi.qr_code_id,
      videoUrl: poi.video_url,
      infoTitle: poi.info_title,
      infoText: poi.info_text,
      infoImageUrl: poi.info_image_url,
      isActive: poi.is_active,
      sortOrder: poi.sort_order,
    }));

    return { data: pois, error: null };
  } catch (error) {
    console.error('Error in getPresentationPOIs:', error);
    return { data: [], error };
  }
};

/**
 * Create a new POI (admin only)
 */
export const createPOI = async (poi, userId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_pois')
      .insert({
        name: poi.name,
        description: poi.description,
        position_x: poi.positionX,
        position_y: poi.positionY,
        icon: poi.icon || 'location',
        icon_color: poi.iconColor || '#E8B84A',
        qr_code_id: poi.qrCodeId,
        video_url: poi.videoUrl,
        info_title: poi.infoTitle,
        info_text: poi.infoText,
        info_image_url: poi.infoImageUrl,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating POI:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createPOI:', error);
    return { success: false, error };
  }
};

/**
 * Update an existing POI (admin only)
 */
export const updatePOI = async (poiId, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
    if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.iconColor !== undefined) dbUpdates.icon_color = updates.iconColor;
    if (updates.qrCodeId !== undefined) dbUpdates.qr_code_id = updates.qrCodeId;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.infoTitle !== undefined) dbUpdates.info_title = updates.infoTitle;
    if (updates.infoText !== undefined) dbUpdates.info_text = updates.infoText;
    if (updates.infoImageUrl !== undefined) dbUpdates.info_image_url = updates.infoImageUrl;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('presentation_pois')
      .update(dbUpdates)
      .eq('id', poiId)
      .select()
      .single();

    if (error) {
      console.error('Error updating POI:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePOI:', error);
    return { success: false, error };
  }
};

/**
 * Delete a POI (admin only)
 */
export const deletePOI = async (poiId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('presentation_pois')
      .delete()
      .eq('id', poiId);

    if (error) {
      console.error('Error deleting POI:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deletePOI:', error);
    return { success: false, error };
  }
};

/**
 * Get user's POI scan progress
 */
export const getUserPOIProgress = async (userId) => {
  if (!isSupabaseConfigured() || !userId) {
    return { scannedIds: [], totalPois: 0, scannedCount: 0, allComplete: false };
  }

  try {
    // Get all active POIs
    const { data: pois } = await supabase
      .from('presentation_pois')
      .select('id')
      .eq('is_active', true);

    // Get user's scans
    const { data: scans } = await supabase
      .from('poi_scans')
      .select('poi_id')
      .eq('user_id', userId);

    const totalPois = pois?.length || 0;
    const scannedIds = (scans || []).map(s => s.poi_id);
    const scannedCount = scannedIds.length;
    const allComplete = totalPois > 0 && scannedCount >= totalPois;

    return { scannedIds, totalPois, scannedCount, allComplete };
  } catch (error) {
    console.error('Error in getUserPOIProgress:', error);
    return { scannedIds: [], totalPois: 0, scannedCount: 0, allComplete: false };
  }
};

/**
 * Record a POI scan
 */
export const recordPOIScan = async (userId, poiId) => {
  if (!isSupabaseConfigured() || !userId || !poiId) {
    return { success: false, error: 'Missing parameters' };
  }

  try {
    const { data, error } = await supabase
      .from('poi_scans')
      .insert({
        user_id: userId,
        poi_id: poiId,
      })
      .select()
      .single();

    if (error) {
      // Check if duplicate
      if (error.code === '23505') {
        return { success: true, alreadyScanned: true };
      }
      console.error('Error recording POI scan:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in recordPOIScan:', error);
    return { success: false, error };
  }
};

/**
 * Find POI by QR code ID
 */
export const findPOIByQRCode = async (qrCodeId) => {
  if (!isSupabaseConfigured() || !qrCodeId) {
    return { data: null, error: 'Missing parameters' };
  }

  try {
    const { data, error } = await supabase
      .from('presentation_pois')
      .select('*')
      .eq('qr_code_id', qrCodeId.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding POI:', error);
      return { data: null, error };
    }

    if (data) {
      // Transform to match component format
      return {
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          positionX: data.position_x,
          positionY: data.position_y,
          icon: data.icon,
          iconColor: data.icon_color,
          qrCodeId: data.qr_code_id,
          videoUrl: data.video_url,
          infoTitle: data.info_title,
          infoText: data.info_text,
          infoImageUrl: data.info_image_url,
        },
        error: null,
      };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in findPOIByQRCode:', error);
    return { data: null, error };
  }
};

export default {
  getPresentationSettings,
  isPresentationModeActive,
  togglePresentationMode,
  updatePresentationSettings,
  getPresentationPOIs,
  createPOI,
  updatePOI,
  deletePOI,
  getUserPOIProgress,
  recordPOIScan,
  findPOIByQRCode,
};
