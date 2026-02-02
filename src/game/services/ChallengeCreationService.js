// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Challenge Creation Service
// Backend service for creating and managing challenges (Admin only)
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { CHALLENGE_TIERS, CHALLENGE_TYPES, CHALLENGE_MODES } from '../config/challenges';

/**
 * Get all available icons for challenges
 */
export const getAvailableChallengeIcons = () => [
  { icon: 'ribbon', name: 'Ribbon' },
  { icon: 'ribbon-outline', name: 'Ribbon Outline' },
  { icon: 'trophy', name: 'Trophy' },
  { icon: 'medal', name: 'Medal' },
  { icon: 'star', name: 'Star' },
  { icon: 'flame', name: 'Flame' },
  { icon: 'compass', name: 'Compass' },
  { icon: 'map', name: 'Map' },
  { icon: 'flag', name: 'Flag' },
  { icon: 'school', name: 'School' },
  { icon: 'people', name: 'People' },
  { icon: 'people-circle', name: 'People Circle' },
  { icon: 'color-palette', name: 'Color Palette' },
  { icon: 'albums', name: 'Albums' },
  { icon: 'git-network', name: 'Network' },
  { icon: 'business', name: 'Business' },
  { icon: 'boat', name: 'Boat' },
  { icon: 'snow', name: 'Snow' },
  { icon: 'globe', name: 'Globe' },
  { icon: 'earth', name: 'Earth' },
  { icon: 'sparkles', name: 'Sparkles' },
  { icon: 'diamond', name: 'Diamond' },
  { icon: 'heart', name: 'Heart' },
  { icon: 'rocket', name: 'Rocket' },
];

/**
 * Get all available progress keys for progress-based challenges
 */
export const getProgressKeys = () => [
  { key: 'completedQuests', name: 'Completed Quests', description: 'Total quests completed' },
  { key: 'friendCount', name: 'Friend Count', description: 'Number of friends added' },
  { key: 'friendTeams', name: 'Friend Teams', description: 'Number of different teams with friends' },
  { key: 'workshopVisited', name: 'Workshop Visited', description: 'Workshop attendance' },
  { key: 'dailyStreak', name: 'Daily Streak', description: 'Consecutive daily login streak' },
  { key: 'collectedCards', name: 'Collected Cards', description: 'Number of cards collected' },
  { key: 'networkingFrankreich', name: 'Networking France', description: 'French networking connections' },
  { key: 'networkingEngland', name: 'Networking England', description: 'English networking connections' },
  { key: 'networkingLuxemburg', name: 'Networking Luxembourg', description: 'Luxembourg networking connections' },
  { key: 'exploredDeutschland', name: 'Explored Germany', description: 'German attractions visited' },
  { key: 'adventureGriechenland', name: 'Greek Adventure', description: 'Greek adventures completed' },
  { key: 'vikingSkandinavia', name: 'Viking Scandinavia', description: 'Scandinavian quests completed' },
];

/**
 * Get list of available cards for rewards
 */
export const getAvailableCards = async () => {
  // Hardcoded list based on public/cards directory
  return [
    { id: 'marcus', name: 'Marcus Ernst', imagePath: 'Marcus Ernst.jpeg' },
    { id: 'ramy', name: 'Ramy Töpperwien', imagePath: 'Ramy Töpperwien.jpeg' },
    { id: 'roland', name: 'Roland Mack', imagePath: 'Roland Mack.jpeg' },
    { id: 'ivo', name: 'Ivo Strohammer', imagePath: 'Ivo Strohammer.jpeg' },
    { id: 'bartholomeus', name: 'Bartholomeus', imagePath: 'Bartholomeus.png' },
    { id: 'cathrine', name: 'Cathrine', imagePath: 'Cathrine.png' },
    { id: 'giacomo', name: 'Giacomo', imagePath: 'giacomo.png' },
    { id: 'madame_freudenreich', name: 'Madame Freudenreich', imagePath: 'Madame Freudenreich.png' },
    { id: 'michael_mack', name: 'Michael Mack', imagePath: 'Michael Mack 2.png' },
    { id: 'nikola_tesla', name: 'Nikola Tesla', imagePath: 'Nikola Tesla.png' },
    { id: 'snorri', name: 'Snorri', imagePath: 'snorri.png' },
    { id: 'edda', name: 'Edda Euromausi', imagePath: 'edda euromausi.png' },
    { id: 'ed', name: 'Ed Euromausi', imagePath: 'ed euromauis.png' },
    { id: 'eulenstein', name: 'Eulenstein', imagePath: 'Card Eulenstein.png' },
  ];
};

/**
 * Fetch all quests for selection in questline creation
 */
export const fetchAvailableQuests = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured', quests: [] };
  }

  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      quests: data || [],
    };
  } catch (error) {
    console.error('Error fetching available quests:', error);
    return { success: false, error: error.message, quests: [] };
  }
};

/**
 * Validate challenge data before creation
 */
export const validateChallengeData = (data) => {
  const errors = [];

  // Required fields
  if (!data.title?.trim()) {
    errors.push('Title is required');
  }
  if (!data.description?.trim()) {
    errors.push('Description is required');
  }
  if (!data.tier) {
    errors.push('Tier is required');
  }
  if (!data.icon) {
    errors.push('Icon is required');
  }

  // Mode-specific validation
  if (data.challengeMode === 'questline') {
    if (!data.quests || data.quests.length === 0) {
      errors.push('At least one quest is required for a questline challenge');
    }
  } else {
    // Progress-based
    if (!data.progressKey) {
      errors.push('Progress key is required for progress-based challenges');
    }
    if (!data.target || data.target < 1) {
      errors.push('Target value must be at least 1');
    }
  }

  // Reward validation
  if (data.reward?.type === 'physical_card') {
    if (!data.reward?.cardId) {
      errors.push('Card ID is required for physical card reward');
    }
    if (!data.reward?.claimLocation?.trim()) {
      errors.push('Claim location is required for physical card reward');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a unique challenge ID/key from title
 */
export const generateChallengeKey = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  return `${base}_${timestamp}`;
};

/**
 * Create a new challenge
 */
export const createChallenge = async (challengeData, adminId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  // Validate data
  const validation = validateChallengeData(challengeData);
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  try {
    // Generate unique key
    const key = generateChallengeKey(challengeData.title);
    const id = key;

    // Determine target for questline challenges
    let target = challengeData.target;
    if (challengeData.challengeMode === 'questline') {
      target = challengeData.quests?.length || 1;
    }

    // Get highest sort_order
    const { data: lastChallenge } = await supabase
      .from('event_challenges')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastChallenge?.sort_order || 0) + 1;

    // Create the challenge record
    const challengeRecord = {
      id,
      key,
      title: challengeData.title.trim(),
      description: challengeData.description.trim(),
      long_description: challengeData.longDescription?.trim() || null,
      type: challengeData.type || 'quest_count',
      icon: challengeData.icon,
      target,
      progress_key: challengeData.challengeMode === 'questline' 
        ? `questline_${key}` 
        : challengeData.progressKey,
      xp_reward: challengeData.xpReward || 100,
      tier: challengeData.tier,
      gradient: challengeData.gradient || CHALLENGE_TIERS[challengeData.tier]?.gradient || ['#8B5CF6', '#7C3AED'],
      checklist_items: challengeData.checklistItems || null,
      country: challengeData.country || null,
      location_id: challengeData.locationId || null,
      requires_scan: challengeData.requiresScan || false,
      reward: challengeData.reward || {
        type: 'physical_card',
        cardId: 'marcus',
        claimLocation: 'Info-Stand',
      },
      is_active: true,
      sort_order: sortOrder,
      challenge_mode: challengeData.challengeMode || 'progress',
    };

    // Insert the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('event_challenges')
      .insert(challengeRecord)
      .select()
      .single();

    if (challengeError) throw challengeError;

    // If it's a questline challenge, create the quest links
    if (challengeData.challengeMode === 'questline' && challengeData.quests?.length > 0) {
      const questLinks = challengeData.quests.map((quest, index) => ({
        challenge_id: id,
        quest_id: quest.questId || quest.id,
        sequence_order: index + 1,
        is_required: quest.isRequired !== false,
        bonus_xp: quest.bonusXp || 0,
      }));

      const { error: linkError } = await supabase
        .from('challenge_quests')
        .insert(questLinks);

      if (linkError) {
        // Rollback challenge creation on link error
        await supabase.from('event_challenges').delete().eq('id', id);
        throw linkError;
      }
    }

    return {
      success: true,
      challenge,
    };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing challenge
 */
export const updateChallenge = async (challengeId, updates) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Build update object
    const updateRecord = {};
    
    if (updates.title !== undefined) updateRecord.title = updates.title.trim();
    if (updates.description !== undefined) updateRecord.description = updates.description.trim();
    if (updates.longDescription !== undefined) updateRecord.long_description = updates.longDescription?.trim() || null;
    if (updates.icon !== undefined) updateRecord.icon = updates.icon;
    if (updates.tier !== undefined) updateRecord.tier = updates.tier;
    if (updates.xpReward !== undefined) updateRecord.xp_reward = updates.xpReward;
    if (updates.target !== undefined) updateRecord.target = updates.target;
    if (updates.progressKey !== undefined) updateRecord.progress_key = updates.progressKey;
    if (updates.reward !== undefined) updateRecord.reward = updates.reward;
    if (updates.gradient !== undefined) updateRecord.gradient = updates.gradient;
    if (updates.isActive !== undefined) updateRecord.is_active = updates.isActive;
    if (updates.requiresScan !== undefined) updateRecord.requires_scan = updates.requiresScan;

    const { data, error } = await supabase
      .from('event_challenges')
      .update(updateRecord)
      .eq('id', challengeId)
      .select()
      .single();

    if (error) throw error;

    // If updating questline quests
    if (updates.quests !== undefined && updates.challengeMode === 'questline') {
      // Delete existing quest links
      await supabase
        .from('challenge_quests')
        .delete()
        .eq('challenge_id', challengeId);

      // Insert new quest links
      if (updates.quests.length > 0) {
        const questLinks = updates.quests.map((quest, index) => ({
          challenge_id: challengeId,
          quest_id: quest.questId || quest.id,
          sequence_order: index + 1,
          is_required: quest.isRequired !== false,
          bonus_xp: quest.bonusXp || 0,
        }));

        const { error: linkError } = await supabase
          .from('challenge_quests')
          .insert(questLinks);

        if (linkError) throw linkError;
      }

      // Update target to match quest count
      await supabase
        .from('event_challenges')
        .update({ target: updates.quests.length })
        .eq('id', challengeId);
    }

    return { success: true, challenge: data };
  } catch (error) {
    console.error('Error updating challenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a challenge
 */
export const deleteChallenge = async (challengeId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Delete quest links first (cascade should handle this, but being explicit)
    await supabase
      .from('challenge_quests')
      .delete()
      .eq('challenge_id', challengeId);

    // Delete user progress
    await supabase
      .from('user_challenge_quest_progress')
      .delete()
      .eq('challenge_id', challengeId);

    // Delete user event challenge records
    await supabase
      .from('user_event_challenges')
      .delete()
      .eq('challenge_id', challengeId);

    // Delete the challenge
    const { error } = await supabase
      .from('event_challenges')
      .delete()
      .eq('id', challengeId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reorder challenges
 */
export const reorderChallenges = async (challengeIds) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Update sort_order for each challenge
    const updates = challengeIds.map((id, index) => 
      supabase
        .from('event_challenges')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error) {
    console.error('Error reordering challenges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clone an existing challenge
 */
export const cloneChallenge = async (challengeId, newTitle) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Fetch the original challenge
    const { data: original, error: fetchError } = await supabase
      .from('event_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Fetch quest links if questline
    let quests = [];
    if (original.challenge_mode === 'questline') {
      const { data: links } = await supabase
        .from('challenge_quests')
        .select('quest_id, sequence_order, is_required, bonus_xp')
        .eq('challenge_id', challengeId)
        .order('sequence_order');
      
      quests = (links || []).map(link => ({
        questId: link.quest_id,
        isRequired: link.is_required,
        bonusXp: link.bonus_xp,
      }));
    }

    // Create new challenge with updated title
    const newChallengeData = {
      title: newTitle || `${original.title} (Copy)`,
      description: original.description,
      longDescription: original.long_description,
      type: original.type,
      icon: original.icon,
      tier: original.tier,
      xpReward: original.xp_reward,
      target: original.target,
      progressKey: original.progress_key,
      gradient: original.gradient,
      checklistItems: original.checklist_items,
      country: original.country,
      locationId: original.location_id,
      requiresScan: original.requires_scan,
      reward: original.reward,
      challengeMode: original.challenge_mode,
      quests,
    };

    return await createChallenge(newChallengeData);
  } catch (error) {
    console.error('Error cloning challenge:', error);
    return { success: false, error: error.message };
  }
};

// Export all utilities
export default {
  getAvailableChallengeIcons,
  getProgressKeys,
  getAvailableCards,
  fetchAvailableQuests,
  validateChallengeData,
  generateChallengeKey,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  reorderChallenges,
  cloneChallenge,
  CHALLENGE_TIERS,
  CHALLENGE_TYPES,
  CHALLENGE_MODES,
};
