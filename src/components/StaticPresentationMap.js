// ═══════════════════════════════════════════════════════════════════════════
// ETERNAL PATH - Static Presentation Map
// ═══════════════════════════════════════════════════════════════════════════
// Shows a static floor plan image with POI markers positioned relative to it

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADII } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Quest Marker Component (for presentation quests)
const QuestMarker = ({ quest, status }) => {
  const isCompleted = status === 'completed';

  // Get team color based on category
  const getTeamColor = (category) => {
    const colors = {
      blue: '#5DADE2',
      gold: '#E8B84A',
      red: '#E74C3C',
      green: '#2ECC71',
      purple: '#9B59B6',
    };
    return colors[category] || COLORS.primary;
  };

  const iconColor = getTeamColor(quest.category);

  return (
    <View
      style={[
        styles.questMarker,
        {
          left: `${quest.positionX}%`,
          top: `${quest.positionY}%`,
        },
      ]}
      pointerEvents="none"
    >
      {/* Marker Icon */}
      <View
        style={[
          styles.questIcon,
          isCompleted ? styles.questCompleted : styles.questIncomplete,
          { borderColor: isCompleted ? COLORS.success : iconColor },
        ]}
      >
        <Ionicons
          name={isCompleted ? 'checkmark' : (quest.icon || 'compass')}
          size={18}
          color={isCompleted ? COLORS.success : iconColor}
        />
      </View>

      {/* Label */}
      <View style={[styles.questLabel, isCompleted && styles.questLabelCompleted]}>
        <Text
          style={[styles.questLabelText, isCompleted && styles.questLabelTextCompleted]}
          numberOfLines={1}
        >
          {quest.title}
        </Text>
        {!isCompleted && (
          <Text style={[styles.questXpText, { color: iconColor }]}>
            +{quest.xp_reward || 100} XP
          </Text>
        )}
      </View>
    </View>
  );
};

// POI Marker Component
const POIMarker = ({ poi, isScanned, onPress, isAdmin, onAdminPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanned) {
      // Pulse animation for unscanned POIs
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScanned]);

  const iconColor = poi.iconColor || COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.poiMarker,
        {
          left: `${poi.positionX}%`,
          top: `${poi.positionY}%`,
        },
      ]}
      onPress={() => (isAdmin && onAdminPress ? onAdminPress(poi) : onPress(poi))}
      activeOpacity={0.8}
    >
      {/* Glow effect for unscanned */}
      {!isScanned && (
        <Animated.View
          style={[
            styles.markerGlow,
            {
              backgroundColor: iconColor,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.5],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Marker Icon */}
      <Animated.View
        style={[
          styles.markerIcon,
          isScanned ? styles.markerScanned : styles.markerUnscanned,
          { borderColor: iconColor },
          !isScanned && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Ionicons
          name={isScanned ? 'checkmark' : (poi.icon || 'location')}
          size={20}
          color={isScanned ? COLORS.success : iconColor}
        />
      </Animated.View>

      {/* Label */}
      <View style={[styles.markerLabel, isScanned && styles.markerLabelScanned]}>
        <Text
          style={[styles.markerLabelText, isScanned && styles.markerLabelTextScanned]}
          numberOfLines={1}
        >
          {poi.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const StaticPresentationMap = ({
  imageUrl,
  pois = [],
  scannedPoiIds = [],
  onPoiPress,
  // Quest props
  quests = [],
  completedQuestIds = [],
  activeQuestIds = [],
  onQuestPress,
  // Admin props
  isAdmin = false,
  onAdminPoiPress,
  onAddPoiPress, // Admin: callback when tapping to add POI
  isAddingPoi = false, // Admin: mode for adding new POI
  onAddQuestPress, // Admin: callback to add quest
  isAddingQuest = false, // Admin: mode for adding new quest
}) => {
  const insets = useSafeAreaInsets();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });

  const handleImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerLayout({ width, height });
  };

  const handleImagePress = (event) => {
    // Handle adding quest
    if (isAddingQuest && onAddQuestPress) {
      const { locationX, locationY } = event.nativeEvent;
      const positionX = (locationX / containerLayout.width) * 100;
      const positionY = (locationY / containerLayout.height) * 100;
      onAddQuestPress({ positionX, positionY });
      return;
    }
    
    // Handle adding POI
    if (isAddingPoi && onAddPoiPress) {
      const { locationX, locationY } = event.nativeEvent;
      const positionX = (locationX / containerLayout.width) * 100;
      const positionY = (locationY / containerLayout.height) * 100;
      onAddPoiPress({ positionX, positionY });
      return;
    }
  };

  // Calculate progress for POIs
  const totalPois = pois.filter(p => p.isActive !== false).length;
  const scannedCount = scannedPoiIds.length;
  const poiProgress = totalPois > 0 ? scannedCount / totalPois : 0;
  
  // Calculate progress for POIs (Points of Interest)
  const totalPOIs = quests.filter(q => q.is_active !== false).length;
  const completedPOICount = completedQuestIds.length;
  const poiProgressValue = totalPOIs > 0 ? completedPOICount / totalPOIs : 0;
  
  // Combined progress (if both exist, show both; if only one exists, show that)
  const hasPOIs = totalPOIs > 0;
  const hasPois = totalPois > 0;

  return (
    <View style={styles.container}>
      {/* Progress Bars */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 10 }]}>
        {/* POIs Progress */}
        {hasPOIs && (
          <>
            <View style={styles.progressHeader}>
              <View style={styles.progressTitleRow}>
                <Ionicons name="compass" size={16} color={COLORS.primary} />
                <Text style={styles.progressTitle}>Points of Interest</Text>
              </View>
              <Text style={styles.progressText}>
                {completedPOICount}/{totalPOIs}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={COLORS.gradients.gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${poiProgressValue * 100}%` }]}
              />
            </View>
          </>
        )}
        
        {/* POIs Progress */}
        {hasPois && (
          <>
            <View style={[styles.progressHeader, hasPOIs && { marginTop: 12 }]}>
              <View style={styles.progressTitleRow}>
                <Ionicons name="location" size={16} color="#5DADE2" />
                <Text style={styles.progressTitle}>Stationen</Text>
              </View>
              <Text style={[styles.progressText, { color: '#5DADE2' }]}>
                {scannedCount}/{totalPois}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#5DADE2', '#3498DB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${poiProgress * 100}%` }]}
              />
            </View>
          </>
        )}
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer} onLayout={handleImageLayout}>
        {imageUrl ? (
          <>
            {/* Loading Indicator */}
            {!imageLoaded && !imageError && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Karte wird geladen...</Text>
              </View>
            )}

            {/* Error State */}
            {imageError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                <Text style={styles.errorText}>Karte konnte nicht geladen werden</Text>
              </View>
            )}

            {/* Map Image */}
            <TouchableOpacity
              activeOpacity={(isAddingPoi || isAddingQuest) ? 0.9 : 1}
              onPress={handleImagePress}
              style={styles.imageWrapper}
              disabled={!isAddingPoi && !isAddingQuest}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.mapImage}
                resizeMode="contain"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Quest Markers */}
              {imageLoaded && quests.filter(q => q.is_active !== false).map((quest) => {
                let status = 'available';
                if (completedQuestIds.includes(quest.id)) {
                  status = 'completed';
                } else if (activeQuestIds.includes(quest.id)) {
                  status = 'active';
                }
                return (
                  <QuestMarker
                    key={`quest-${quest.id}`}
                    quest={quest}
                    status={status}
                  />
                );
              })}

              {/* POI Markers */}
              {imageLoaded && pois.filter(p => p.isActive !== false).map((poi) => (
                <POIMarker
                  key={`poi-${poi.id}`}
                  poi={poi}
                  isScanned={scannedPoiIds.includes(poi.id)}
                  onPress={onPoiPress}
                  isAdmin={isAdmin}
                  onAdminPress={onAdminPoiPress}
                />
              ))}

              {/* Adding Quest Mode Indicator */}
              {isAddingQuest && (
                <View style={[styles.addingModeOverlay, styles.addingQuestOverlay]}>
                  <Ionicons name="compass" size={20} color={COLORS.text.primary} />
                  <Text style={styles.addingModeText}>
                    Tippe auf die Karte um eine Quest zu platzieren
                  </Text>
                </View>
              )}

              {/* Adding POI Mode Indicator */}
              {isAddingPoi && (
                <View style={styles.addingModeOverlay}>
                  <Ionicons name="location" size={20} color={COLORS.text.primary} />
                  <Text style={styles.addingModeText}>
                    Tippe auf die Karte um einen POI zu platzieren
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noMapContainer}>
            <Ionicons name="map-outline" size={64} color={COLORS.text.muted} />
            <Text style={styles.noMapText}>Keine Karte verfügbar</Text>
          </View>
        )}
      </View>

      {/* Admin: Add Quest / Add POI Buttons */}
      {isAdmin && (onAddQuestPress || onAddPoiPress) && (
        <View style={[styles.adminActions, { paddingBottom: insets.bottom + 80 }]}>
          {/* Add Quest Button */}
          {onAddQuestPress && (
            <TouchableOpacity
              style={[styles.addButton, isAddingQuest && styles.addButtonActive]}
              onPress={() => onAddQuestPress(null)} // null = toggle mode
            >
              <LinearGradient
                colors={isAddingQuest ? ['#E74C3C', '#C0392B'] : COLORS.gradients.gold}
                style={styles.addButtonGradient}
              >
                <Ionicons
                  name={isAddingQuest ? 'close' : 'compass'}
                  size={22}
                  color={COLORS.text.primary}
                />
                <Text style={styles.addButtonText}>
                  {isAddingQuest ? 'Abbrechen' : 'POI hinzufügen'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Add POI Button */}
          {onAddPoiPress && (
            <TouchableOpacity
              style={[styles.addButton, styles.addPoiButton, isAddingPoi && styles.addButtonActive]}
              onPress={() => onAddPoiPress(null)} // null = toggle mode
            >
              <LinearGradient
                colors={isAddingPoi ? ['#E74C3C', '#C0392B'] : ['#5DADE2', '#3498DB']}
                style={styles.addButtonGradient}
              >
                <Ionicons
                  name={isAddingPoi ? 'close' : 'location'}
                  size={22}
                  color={COLORS.text.primary}
                />
                <Text style={styles.addButtonText}>
                  {isAddingPoi ? 'Abbrechen' : 'POI hinzufügen'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={[styles.legend, { bottom: insets.bottom + 80 }]}>
        {hasPOIs && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>POI</Text>
          </View>
        )}
        {hasPois && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#5DADE2' }]} />
            <Text style={styles.legendText}>Station</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Erledigt</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },

  // Progress
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(13,27,42,0.9)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Map
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noMapText: {
    color: COLORS.text.muted,
    fontSize: 16,
  },

  // POI Marker
  poiMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -32 }],
  },
  markerGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  markerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...SHADOWS.md,
  },
  markerUnscanned: {
    backgroundColor: COLORS.surface,
  },
  markerScanned: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderColor: COLORS.success,
  },
  markerLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.sm,
    maxWidth: 120,
    ...SHADOWS.sm,
  },
  markerLabelScanned: {
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  markerLabelTextScanned: {
    color: COLORS.success,
  },

  // Quest Marker
  questMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -36 }],
    zIndex: 10,
  },
  questGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  questIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...SHADOWS.md,
  },
  questIncomplete: {
    backgroundColor: COLORS.surface,
  },
  questCompleted: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderColor: COLORS.success,
  },
  questLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.sm,
    maxWidth: 100,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  questLabelCompleted: {
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
  },
  questLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  questLabelTextCompleted: {
    color: COLORS.success,
  },
  questXpText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },

  // Adding mode
  addingModeOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#5DADE2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADII.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addingQuestOverlay: {
    backgroundColor: COLORS.primary,
  },
  addingModeText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Admin Actions
  adminActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  addButton: {
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  addPoiButton: {
    marginTop: 0,
  },
  addButtonActive: {},
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },

  // Legend
  legend: {
    position: 'absolute',
    left: 16,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
});

export default StaticPresentationMap;
