// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Event Challenge Card Component
// Für übergreifende Event-Challenges mit echten Sammelkarten
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { CHALLENGE_TIERS } from '../game/config/challenges';
import { COLLECTIBLE_CARDS } from '../game/config/cardsData';

const EventChallengeCard = ({
  challenge,
  currentProgress = 0,
  onPress,
  onClaim,
  isClaimed = false,
  compact = false,
  isAdmin = false,
  onAdminComplete,
  onAdminUncomplete,
}) => {
  if (!challenge) return null;

  const progress = Math.min(currentProgress, challenge.target);
  const progressPercent = (progress / challenge.target) * 100;
  const isCompleted = progress >= challenge.target;
  const tier = CHALLENGE_TIERS[challenge.tier] || CHALLENGE_TIERS.bronze;
  
  // Karte aus cardId auflösen
  const card = challenge.reward?.cardId 
    ? COLLECTIBLE_CARDS[challenge.reward.cardId] 
    : challenge.reward?.card;

  // Checklist für Rainbow-Challenge etc.
  const renderChecklist = () => {
    if (!challenge.checklistItems) return null;

    return (
      <View style={styles.checklist}>
        {challenge.checklistItems.map((item, index) => {
          // Hier würde man prüfen ob der Spieler einen Freund in diesem Team hat
          const isChecked = false; // Placeholder - wird vom Parent übergeben
          return (
            <View key={item.key} style={styles.checklistItem}>
              <View style={[styles.checklistIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons 
                  name={isChecked ? 'checkmark-circle' : item.icon} 
                  size={16} 
                  color={isChecked ? '#10B981' : item.color} 
                />
              </View>
              <Text style={[styles.checklistLabel, isChecked && styles.checklistLabelChecked]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Karten-Bild Pfad für Web/Native
  const getCardImageSource = () => {
    if (!card?.image) return null;
    
    // Für Web: relativer Pfad von public
    if (Platform.OS === 'web') {
      return { uri: card.image };
    }
    // Für Native: require würde hier nicht funktionieren, also URI
    return { uri: card.image };
  };

  // Belohnungs-Badge (immer echte Karte)
  const renderRewardBadge = () => {
    return (
      <View style={[styles.rewardBadge, { backgroundColor: '#FFD700' + '20' }]}>
        <Ionicons name="card" size={12} color="#FFD700" />
        <Text style={[styles.rewardBadgeText, { color: '#FFD700' }]}>
          Echte Karte
        </Text>
      </View>
    );
  };

  // Karten-Vorschau rendern
  const renderCardPreview = () => {
    if (!card) return null;

    const imageSource = getCardImageSource();
    
    return (
      <View style={styles.cardPreviewContainer}>
        <View style={styles.cardPreviewWrapper}>
          {/* Goldener Glow-Effekt */}
          <View style={styles.cardGlow} />
          
          {/* Karten-Bild */}
          <View style={styles.cardImageContainer}>
            {imageSource && (
              <Image 
                source={imageSource}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            
            {/* Rarity Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.cardOverlay}
            >
              <Text style={styles.cardName} numberOfLines={1}>
                {card.name}
              </Text>
              <View style={styles.rarityBadge}>
                <Ionicons 
                  name={card.rarity === 'legendary' ? 'star' : 'star-half'} 
                  size={10} 
                  color="#FFD700" 
                />
                <Text style={styles.rarityText}>
                  {card.rarity === 'legendary' ? 'Legendary' : 'Epic'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
        
        {/* Special Badge */}
        {challenge.reward?.special && (
          <View style={styles.specialBadge}>
            <Ionicons name="sparkles" size={10} color="#FFF" />
            <Text style={styles.specialText}>{challenge.reward.special}</Text>
          </View>
        )}
      </View>
    );
  };

  if (compact) {
    // Gray out if claimed (includes admin-completed challenges)
    const isGrayedOut = isClaimed;
    return (
      <View style={styles.compactWrapper}>
        <TouchableOpacity 
          style={[styles.compactCard, isGrayedOut && styles.compactCardGrayed]}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <LinearGradient
            colors={isGrayedOut 
              ? [COLORS.text.muted, COLORS.text.muted] 
              : (challenge.gradient || tier.gradient || [tier.color, tier.color])}
            style={[styles.compactIconContainer, isGrayedOut && styles.compactIconGrayed]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={isGrayedOut ? 'checkmark-done' : challenge.icon} size={20} color={isGrayedOut ? COLORS.surface : '#FFF'} />
          </LinearGradient>
          <View style={styles.compactContent}>
            <Text style={[styles.compactTitle, isGrayedOut && styles.compactTitleGrayed]} numberOfLines={1}>{challenge.title}</Text>
            <View style={[styles.compactProgressBar, isGrayedOut && styles.compactProgressBarGrayed]}>
              <View style={[styles.compactProgressFill, isGrayedOut && styles.compactProgressFillGrayed, { width: `${progressPercent}%` }]} />
            </View>
          </View>
          {isGrayedOut ? (
            <View style={styles.compactCompletedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            </View>
          ) : (
            <Text style={styles.compactProgress}>{progress}/{challenge.target}</Text>
          )}
        </TouchableOpacity>
        {isAdmin && isClaimed && (
          <TouchableOpacity 
            style={styles.compactAdminBtn}
            onPress={onAdminUncomplete}
          >
            <Ionicons name="arrow-undo" size={14} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && !isClaimed && styles.cardCompleted]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={challenge.gradient || [tier.color, tier.color]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            {/* Zeige Länder-Flag oder Icon */}
            {challenge.country?.flag ? (
              <Text style={styles.countryFlagLarge}>{challenge.country.flag}</Text>
            ) : (
              <Ionicons name={challenge.icon} size={28} color="#FFF" />
            )}
          </View>
          <View style={styles.headerText}>
            <View style={styles.tierRow}>
              <View style={styles.tierBadge}>
                <Ionicons name={tier.icon} size={10} color="#FFF" />
                <Text style={styles.tierText}>{tier.name}</Text>
              </View>
              {renderRewardBadge()}
            </View>
            <Text style={styles.title}>{challenge.title}</Text>
          </View>
        </View>
        
        {/* Completion Badge */}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name={isClaimed ? 'checkmark-done' : 'checkmark-circle'} size={18} color="#FFF" />
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.description}>{challenge.description}</Text>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={challenge.gradient || [tier.color, tier.color]}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.progressNumbers}>
            <Text style={styles.progressText}>
              {progress} / {challenge.target}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
          </View>
        </View>

        {/* Checklist (für Rainbow Friends etc.) */}
        {renderChecklist()}

        {/* Karten-Vorschau */}
        {renderCardPreview()}

        {/* Reward Section */}
        <View style={styles.rewardSection}>
          <View style={styles.rewardInfo}>
            <Ionicons name="card" size={16} color={COLORS.gold} />
            <Text style={styles.rewardLabel}>Reward:</Text>
            <Text style={styles.rewardValue}>
              {card?.name || 'Collectible Card'}
            </Text>
          </View>
          <View style={styles.xpReward}>
            <Ionicons name="flash" size={14} color={COLORS.primary} />
            <Text style={styles.xpText}>+{challenge.scoreReward || challenge.xpReward || 0} Points</Text>
          </View>
        </View>

        {/* Claim Location */}
        {challenge.reward?.claimLocation && (
          <View style={[styles.claimLocation, isCompleted && !isClaimed && styles.claimLocationActive]}>
            <Ionicons name="location" size={14} color={isCompleted && !isClaimed ? "#10B981" : COLORS.text.muted} />
            <Text style={[styles.claimLocationText, isCompleted && !isClaimed && styles.claimLocationTextActive]}>
              Pick up: {challenge.reward.claimLocation}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {isCompleted && !isClaimed && (
          <TouchableOpacity onPress={onClaim}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.claimButton}
            >
              <Text style={styles.claimButtonText}>Claim reward</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isClaimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
            <Text style={styles.claimedText}>Abgeholt!</Text>
          </View>
        )}

        {/* Admin Toggle Section */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.adminDivider} />
            {!isClaimed ? (
              <TouchableOpacity 
                style={styles.adminCompleteBtn}
                onPress={onAdminComplete}
              >
                <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                <Text style={styles.adminBtnText}>Admin: Als abgeschlossen markieren</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.adminUncompleteBtn}
                onPress={onAdminUncomplete}
              >
                <Ionicons name="arrow-undo" size={16} color="#FFF" />
                <Text style={styles.adminBtnText}>Admin: Rückgängig machen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
    marginBottom: 10
  },
  cardCompleted: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  countryFlagLarge: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  content: {
    padding: 16,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    color: COLORS.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  checklistIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  checklistLabelChecked: {
    color: '#10B981',
  },
  // Karten-Vorschau Styles
  cardPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  cardPreviewWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  cardGlow: {
    position: 'absolute',
    width: 100,
    height: 140,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    opacity: 0.2,
    top: -4,
    left: -4,
    ...SHADOWS.glow,
  },
  cardImageContainer: {
    width: 92,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: COLORS.surfaceAlt,
    ...SHADOWS.md,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    alignItems: 'center',
  },
  cardName: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  rarityText: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  specialBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    ...SHADOWS.sm,
  },
  specialText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },

  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  rewardLabel: {
    color: COLORS.text.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardValue: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  claimLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  claimLocationActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  claimLocationText: {
    color: COLORS.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  claimLocationTextActive: {
    color: '#10B981',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
  },
  claimedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },

  // Admin styles
  adminSection: {
    marginTop: 16,
  },
  adminDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: 12,
  },
  adminCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  adminUncompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  adminBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Compact styles
  compactCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactProgressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  compactProgress: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  compactWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactAdminBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  // Grayed out styles for completed challenges
  compactCardGrayed: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.borderLight,
    opacity: 0.7,
  },
  compactIconGrayed: {
    opacity: 0.6,
  },
  compactTitleGrayed: {
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
  },
  compactProgressBarGrayed: {
    backgroundColor: COLORS.borderLight,
  },
  compactProgressFillGrayed: {
    backgroundColor: COLORS.text.muted,
  },
  compactCompletedBadge: {
    marginLeft: 8,
  },
});

export default EventChallengeCard;
