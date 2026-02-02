// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - QR Scanner Service
// Handles QR code scanning and processing for both Quests and Rewards
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../../config/supabase';

/**
 * Process a scanned QR code - checks both quests and reward codes
 * @param {string} scannedData - The raw QR code data (e.g., "ID001", "ID200")
 * @param {string} userId - Current user ID
 * @returns {Object} Result object with type, data, and status
 */
export const processQRCode = async (scannedData, userId) => {
  console.log('[QRScannerService] Processing QR code:', scannedData);

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

  // Try to find in quests table first (for quest completion)
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
 * Check if QR code matches a quest
 */
const checkQuestCode = async (qrCodeId, userId) => {
  if (!isSupabaseConfigured() || !userId) {
    return { found: false };
  }

  try {
    console.log('[QRScannerService] Checking quests table for:', qrCodeId);

    // Search in quests table where metadata contains this qr_code_id
    const { data: quests, error } = await supabase
      .from('quests')
      .select('*')
      .eq('metadata->>qr_code_id', qrCodeId)
      .single();

    if (error || !quests) {
      console.log('[QRScannerService] Quest not found:', error?.message);
      return { found: false };
    }

    console.log('[QRScannerService] Quest found:', quests.id);

    // Check if user has already completed this quest
    const { data: progress } = await supabase
      .from('quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', quests.id)
      .eq('status', 'completed')
      .single();

    if (progress) {
      return {
        found: true,
        success: false,
        type: 'quest',
        error: 'This quest has already been completed',
        quest: quests
      };
    }

    // Mark quest as completed
    const { error: progressError } = await supabase
      .from('quest_progress')
      .upsert({
        user_id: userId,
        quest_id: quests.id,
        status: 'completed',
        progress: quests.target_progress || 1,
        completed_at: new Date().toISOString()
      });

    if (progressError) {
      console.error('[QRScannerService] Error updating progress:', progressError);
      return {
        found: true,
        success: false,
        type: 'quest',
        error: 'Fehler beim Speichern des Fortschritts'
      };
    }

    // Extract info_content from quest metadata
    const infoContent = quests.metadata?.info_content || null;
    
    return {
      found: true,
      success: true,
      type: 'quest',
      quest: quests,
      rewards: {
        xp: quests.xp_reward || 0,
        gems: quests.gem_reward || 0
      },
      infoContent, // Return info content to display to user
      message: `Quest completed! +10 Points`
    };

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
    console.log('[QRScannerService] Checking qr_codes table for:', qrCodeId);

    // Search in qr_codes table
    const { data: qrCode, error: findError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_code_id', qrCodeId)
      .single();

    if (findError || !qrCode) {
      console.log('[QRScannerService] Reward code not found');
      return { found: false };
    }

    console.log('[QRScannerService] Reward code found:', qrCode.id);

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
  checkQuestCode,
  checkRewardCode
};
