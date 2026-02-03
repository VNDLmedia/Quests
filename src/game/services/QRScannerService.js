// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - QR Scanner Service
// Handles QR code scanning and processing for both Quests and Rewards
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { getHardcodedPOI, isHardcodedPOI } from '../config/presentationPOIs';

/**
 * Process a scanned QR code - checks POIs, quests, and reward codes
 * @param {string} scannedData - The raw QR code data (e.g., "ID001", "POI001")
 * @param {string} userId - Current user ID
 * @returns {Object} Result object with type, data, and status
 */
export const processQRCode = async (scannedData, userId) => {
  // console.log('[QRScannerService] Processing QR code:', scannedData);

  if (!scannedData || scannedData.trim() === '') {
    return {
      success: false,
      error: 'QR-Code ist leer',
      type: 'error'
    };
  }

  const trimmedData = scannedData.trim();

  // Check if this is a player/user code (format: USER:xxx or EP-xxx)
  if (trimmedData.startsWith('USER:') || trimmedData.startsWith('EP-')) {
    // Extract user ID from the code
    let friendId;
    if (trimmedData.startsWith('USER:')) {
      friendId = trimmedData.substring(5); // Remove 'USER:' prefix
    } else {
      friendId = trimmedData.substring(3); // Remove 'EP-' prefix
    }
    
    console.log('[QRScannerService] Player code detected, friendId:', friendId);
    
    // Process as friend request
    const playerResult = await checkPlayerCode(friendId, userId);
    return playerResult;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK HARDCODED PRESENTATION POIs FIRST
  // These are demo POIs with predefined content (no database lookup needed)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isHardcodedPOI(trimmedData)) {
    const hardcodedPOI = getHardcodedPOI(trimmedData);
    console.log('[QRScannerService] Hardcoded POI found:', hardcodedPOI.name);
    
    // For hardcoded POIs, we don't track in database - just return the content
    // This allows repeated scanning for demo purposes
    return {
      found: true,
      success: true,
      type: 'hardcoded_poi',
      poi: hardcodedPOI,
      progress: null, // No progress tracking for hardcoded POIs
      completionData: null,
      message: `Station "${hardcodedPOI.name}" entdeckt!`,
    };
  }

  // Try to find in POIs first (for presentation mode)
  const poiResult = await checkPOICode(trimmedData, userId);
  if (poiResult.found) {
    return poiResult;
  }

  // Try to find in quests table (for quest completion)
  const questResult = await checkQuestCode(trimmedData, userId);
  if (questResult.found) {
    return questResult;
  }

  // Try to find in reward codes table (for gems/XP/packs)
  const rewardResult = await checkRewardCode(trimmedData, userId);
  if (rewardResult.found) {
    return rewardResult;
  }

  // Code not found in any table
  return {
    success: false,
    type: 'unknown',
    error: `QR code "${trimmedData}" is not registered`,
    data: trimmedData
  };
};

/**
 * Check if QR code matches a POI (presentation mode)
 */
const checkPOICode = async (qrCodeId, userId) => {
  if (!isSupabaseConfigured() || !userId) {
    return { found: false };
  }

  try {
    // Search in presentation_pois table
    const { data: poi, error } = await supabase
      .from('presentation_pois')
      .select('*')
      .eq('qr_code_id', qrCodeId.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !poi) {
      return { found: false };
    }

    console.log('[QRScannerService] POI found:', poi.name);

    // Check if user already scanned this POI
    const { data: existingScan } = await supabase
      .from('poi_scans')
      .select('id')
      .eq('user_id', userId)
      .eq('poi_id', poi.id)
      .single();

    if (existingScan) {
      return {
        found: true,
        success: false,
        type: 'poi',
        error: 'Du hast diese Station bereits besucht',
        poi: {
          id: poi.id,
          name: poi.name,
          videoUrl: poi.video_url,
          infoTitle: poi.info_title,
          infoText: poi.info_text,
          infoImageUrl: poi.info_image_url,
        },
        alreadyScanned: true,
      };
    }

    // Record the scan
    await supabase.from('poi_scans').insert({
      user_id: userId,
      poi_id: poi.id,
    });

    // Check if all POIs are now complete
    const { data: allPois } = await supabase
      .from('presentation_pois')
      .select('id')
      .eq('is_active', true);

    const { data: userScans } = await supabase
      .from('poi_scans')
      .select('poi_id')
      .eq('user_id', userId);

    const totalPois = allPois?.length || 0;
    const scannedCount = (userScans?.length || 0) + 1; // +1 for current scan
    const allComplete = scannedCount >= totalPois && totalPois > 0;

    // Get completion hint if all complete
    let completionData = null;
    if (allComplete) {
      const { data: settings } = await supabase
        .from('presentation_settings')
        .select('*')
        .limit(1)
        .single();

      if (settings) {
        completionData = {
          title: settings.completion_hint_title,
          text: settings.completion_hint_text,
          imageUrl: settings.completion_hint_image_url,
          secretHint: settings.secret_card_hint,
        };
      }
    }

    return {
      found: true,
      success: true,
      type: 'poi',
      poi: {
        id: poi.id,
        name: poi.name,
        videoUrl: poi.video_url,
        infoTitle: poi.info_title,
        infoText: poi.info_text,
        infoImageUrl: poi.info_image_url,
      },
      progress: {
        total: totalPois,
        scanned: scannedCount,
        allComplete,
      },
      completionData,
      message: `Station "${poi.name}" besucht!`,
    };

  } catch (error) {
    console.error('[QRScannerService] Error checking POI:', error);
    return { found: false };
  }
};

/**
 * Check if QR code is a player code and add as friend
 */
const checkPlayerCode = async (friendId, userId) => {
  console.log('[QRScannerService] Checking player code:', friendId, 'for user:', userId);

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      type: 'player',
      error: 'Database not configured'
    };
  }

  // Can't add yourself
  if (friendId === userId) {
    return {
      success: false,
      type: 'player',
      error: 'Das bist du selbst!'
    };
  }

  try {
    // Get friend's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single();

    if (profileError || !profile) {
      console.log('[QRScannerService] User not found:', friendId, profileError);
      return {
        success: false,
        type: 'player',
        error: 'User nicht gefunden'
      };
    }

    console.log('[QRScannerService] Found profile:', profile.display_name);

    // Check if already friends (either direction)
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    const friendData = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      score: profile.score || 0,
      team: profile.team,
      bio: profile.bio || '',
      linkedin_url: profile.linkedin_url || '',
    };

    if (existingFriendship) {
      console.log('[QRScannerService] Already friends');
      return {
        success: true,
        type: 'player',
        alreadyFriends: true,
        friend: friendData,
        message: `${profile.display_name || profile.username} ist bereits dein Freund!`
      };
    }

    // Create new friendship with status 'accepted'
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'accepted'
      });

    if (friendshipError) {
      console.log('[QRScannerService] Error creating friendship:', friendshipError);
      // Might be a duplicate (race condition)
      if (friendshipError.code === '23505') {
        return {
          success: true,
          type: 'player',
          alreadyFriends: true,
          friend: friendData,
          message: `${profile.display_name || profile.username} ist bereits dein Freund!`
        };
      }
      return {
        success: false,
        type: 'player',
        error: 'Fehler beim Hinzufügen: ' + friendshipError.message
      };
    }

    console.log('[QRScannerService] Friend added successfully!');
    return {
      success: true,
      type: 'player',
      alreadyFriends: false,
      friend: friendData,
      message: `${profile.display_name || profile.username} wurde als Freund hinzugefügt!`
    };

  } catch (error) {
    console.error('[QRScannerService] Error in checkPlayerCode:', error);
    return {
      success: false,
      type: 'player',
      error: 'Fehler: ' + error.message
    };
  }
};

/**
 * Process a found quest (helper function to avoid code duplication)
 */
const processFoundQuest = async (quest, userId) => {
  // Check if this is a presentation quest (POI)
  const isPresentationQuest = quest.metadata?.is_presentation_quest === true;

  // Check if user has already completed this quest - check BOTH tables
  const { data: userQuestProgress } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_id', quest.id)
    .eq('status', 'completed')
    .single();

  if (userQuestProgress) {
    return {
      found: true,
      success: false,
      type: isPresentationQuest ? 'presentation_quest' : 'quest',
      error: isPresentationQuest ? 'Dieser Point of Interest wurde bereits besucht' : 'This quest has already been completed',
      quest: quest
    };
  }

  // Also check quest_progress table (legacy)
  const { data: legacyProgress } = await supabase
    .from('quest_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_id', quest.id)
    .eq('status', 'completed')
    .single();

  if (legacyProgress) {
    return {
      found: true,
      success: false,
      type: isPresentationQuest ? 'presentation_quest' : 'quest',
      error: isPresentationQuest ? 'Dieser Point of Interest wurde bereits besucht' : 'This quest has already been completed',
      quest: quest
    };
  }

  // Mark quest as completed in user_quests table
  // Try to insert first, then update if exists
  const { error: insertError } = await supabase
    .from('user_quests')
    .insert({
      user_id: userId,
      quest_id: quest.id,
      status: 'completed',
      progress: quest.target_value || 1,
      completed_at: new Date().toISOString()
    });

  // If insert failed due to duplicate, update instead
  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate - update existing record
      const { error: updateError } = await supabase
        .from('user_quests')
        .update({
          status: 'completed',
          progress: quest.target_value || 1,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('quest_id', quest.id);

      if (updateError) {
        console.error('[QRScannerService] Error updating user_quests:', updateError);
        return {
          found: true,
          success: false,
          type: isPresentationQuest ? 'presentation_quest' : 'quest',
          error: 'Fehler beim Aktualisieren des Fortschritts: ' + updateError.message
        };
      }
    } else {
      console.error('[QRScannerService] Error inserting user_quests:', insertError);
      return {
        found: true,
        success: false,
        type: isPresentationQuest ? 'presentation_quest' : 'quest',
        error: 'Fehler beim Speichern des Fortschritts: ' + insertError.message
      };
    }
  }

  // Award XP to user
  if (quest.xp_reward > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('score')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ score: (profile.score || 0) + quest.xp_reward })
        .eq('id', userId);
    }
  }

  // Extract info_content from quest metadata
  const infoContent = quest.metadata?.info_content || null;
  
  return {
    found: true,
    success: true,
    type: isPresentationQuest ? 'presentation_quest' : 'quest',
    quest: quest,
    rewards: {
      xp: quest.xp_reward || 0,
      gems: quest.gem_reward || 0
    },
    infoContent,
    message: isPresentationQuest 
      ? `Point of Interest "${quest.title}" entdeckt! +${quest.xp_reward || 0} Punkte`
      : `Quest completed! +${quest.xp_reward || 0} Points`
  };
};

/**
 * Check if QR code matches a quest
 */
const checkQuestCode = async (qrCodeId, userId) => {
  if (!isSupabaseConfigured() || !userId) {
    return { found: false };
  }

  try {
    // Normalize to uppercase (QR codes are stored uppercase)
    const normalizedQrCode = qrCodeId.toUpperCase();

    // Search in quests table where metadata contains this qr_code_id
    const { data: quest, error } = await supabase
      .from('quests')
      .select('*')
      .eq('metadata->>qr_code_id', normalizedQrCode)
      .single();

    if (error || !quest) {
      // Fallback: Try to find any quest with this QR code in metadata (manual search)
      const { data: allQuests } = await supabase
        .from('quests')
        .select('id, title, metadata')
        .not('metadata', 'is', null);
      
      if (allQuests) {
        const matchingQuest = allQuests.find(q => 
          q.metadata?.qr_code_id?.toUpperCase() === normalizedQrCode
        );
        if (matchingQuest) {
          // Use this quest instead
          const { data: fullQuest } = await supabase
            .from('quests')
            .select('*')
            .eq('id', matchingQuest.id)
            .single();
          
          if (fullQuest) {
            return await processFoundQuest(fullQuest, userId);
          }
        }
      }
      
      return { found: false };
    }

    return await processFoundQuest(quest, userId);

  } catch (error) {
    console.error('[QRScannerService] Error checking quest:', error);
    return { found: false };
  }
};

/**
 * Check if QR code matches a reward code
 */
const checkRewardCode = async (qrCodeId, userId) => {
  if (!isSupabaseConfigured() || !userId) {
    return { found: false };
  }

  try {
    // console.log('[QRScannerService] Checking qr_codes table for:', qrCodeId);

    // Search in qr_codes table
    const { data: qrCode, error: findError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_code_id', qrCodeId)
      .single();

    if (findError || !qrCode) {
      // console.log('[QRScannerService] Reward code not found');
      return { found: false };
    }

    // console.log('[QRScannerService] Reward code found:', qrCode.id);

    // Check if active
    if (!qrCode.is_active) {
      return {
        found: true,
        success: false,
        type: 'reward',
        error: 'QR code is no longer active'
      };
    }

    // Check validity
    if (qrCode.valid_until && new Date(qrCode.valid_until) < new Date()) {
      return {
        found: true,
        success: false,
        type: 'reward',
        error: 'QR-Code ist abgelaufen'
      };
    }

    // Check if user already scanned
    const { data: existingScan } = await supabase
      .from('qr_code_scans')
      .select('id')
      .eq('qr_code_id', qrCode.id)
      .eq('user_id', userId)
      .single();

    if (existingScan) {
      return {
        found: true,
        success: false,
        type: 'reward',
        error: 'Du hast diesen Code bereits gescannt'
      };
    }

    // Check max uses
    if (qrCode.single_use && qrCode.current_uses >= 1) {
      return {
        found: true,
        success: false,
        type: 'reward',
        error: 'QR-Code wurde bereits verwendet'
      };
    }

    if (qrCode.max_uses && qrCode.current_uses >= qrCode.max_uses) {
      return {
        found: true,
        success: false,
        type: 'reward',
        error: 'QR-Code hat maximale Nutzungen erreicht'
      };
    }

    // Process reward
    const featureValue = qrCode.feature_value || {};
    let rewardGiven = {};

    switch (qrCode.feature_type) {
      case 'gems':
        rewardGiven = { gems: featureValue.amount || 50 };
        break;
      case 'xp':
        rewardGiven = { xp: featureValue.amount || 100 };
        break;
      case 'reward':
        rewardGiven = featureValue;
        break;
      case 'pack':
        rewardGiven = { pack: featureValue.pack_type || 'standard' };
        break;
      default:
        rewardGiven = { type: qrCode.feature_type, value: featureValue };
    }

    // Save scan record
    await supabase.from('qr_code_scans').insert({
      qr_code_id: qrCode.id,
      user_id: userId,
      reward_given: rewardGiven,
    });

    // Increment usage count
    await supabase
      .from('qr_codes')
      .update({ current_uses: qrCode.current_uses + 1 })
      .eq('id', qrCode.id);

    return {
      found: true,
      success: true,
      type: 'reward',
      qrCode,
      rewards: rewardGiven,
      message: formatRewardMessage(rewardGiven)
    };

  } catch (error) {
    console.error('[QRScannerService] Error checking reward code:', error);
    return { found: false };
  }
};

/**
 * Format reward message for display
 */
const formatRewardMessage = (rewards) => {
  const parts = [];
  if (rewards.gems) parts.push(`+${rewards.gems} Gems`);
  if (rewards.xp) parts.push(`+${rewards.xp} XP`);
  if (rewards.pack) parts.push(`1x ${rewards.pack} Pack`);

  if (parts.length === 0) {
    return 'Reward received!';
  }

  return parts.join(', ') + ' received!';
};

export default {
  processQRCode,
  checkPOICode,
  checkQuestCode,
  checkRewardCode
};
