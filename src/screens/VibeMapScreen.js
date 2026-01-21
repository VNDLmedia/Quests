import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview'; 
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, COLORS, SHADOWS } from '../theme';
import { useGame } from '../game/GameProvider';
import { useQuests } from '../game/hooks';
import { EUROPARK_LOCATIONS, QUEST_TEMPLATES, calculateDistance, getRandomQuest } from '../game/config/quests';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// Quest interaction radius in meters
const QUEST_INTERACTION_RADIUS = 100;

const MapScreen = () => {
  const webviewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Game Data
  const { currentLocation, updateLocation, dispatch } = useGame();
  const { activeQuests, nearbyQuests, startQuest, getDistanceToQuest } = useQuests();
  
  // State
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [availableQuests, setAvailableQuests] = useState([]);
  const [questDistances, setQuestDistances] = useState({});

  // Pulse animation for active quest
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Location tracking
  useEffect(() => {
    let locationSubscription;
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung verweigert', 'Standortberechtigung wird benötigt.');
        return;
      }
      
      // Get initial location
      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setUserLoc(coords);
      updateLocation(coords);
      
      // Generate quests around user
      generateNearbyQuests(coords);
      
      // Watch location changes
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or every 5 seconds
        },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };
          setUserLoc(newCoords);
          updateLocation(newCoords);
          updateQuestDistances(newCoords);
        }
      );
    })();
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Generate quests around user
  const generateNearbyQuests = useCallback((coords) => {
    const questKeys = ['daily_coffee', 'speed_fountain', 'golden_compass', 'fashionista', 'movie_night'];
    const generatedQuests = [];
    
    questKeys.forEach((key, index) => {
      const template = QUEST_TEMPLATES[key];
      if (!template) return;
      
      // Get location or generate random one nearby
      let questLat, questLng;
      if (template.location && EUROPARK_LOCATIONS[template.location]) {
        const loc = EUROPARK_LOCATIONS[template.location];
        questLat = loc.lat;
        questLng = loc.lng;
      } else {
        // Generate random location within 500m
        questLat = coords.latitude + (Math.random() - 0.5) * 0.009;
        questLng = coords.longitude + (Math.random() - 0.5) * 0.009;
      }
      
      generatedQuests.push({
        id: `spawn_${key}_${Date.now()}`,
        ...template,
        lat: questLat,
        lng: questLng,
        isSpawned: true, // Not yet accepted
        progress: 0,
      });
    });
    
    setAvailableQuests(generatedQuests);
  }, []);

  // Update distances to quests
  const updateQuestDistances = useCallback((coords) => {
    const distances = {};
    availableQuests.forEach(quest => {
      const dist = calculateDistance(coords.latitude, coords.longitude, quest.lat, quest.lng);
      distances[quest.id] = Math.round(dist);
    });
    setQuestDistances(distances);
  }, [availableQuests]);

  // Check if user can interact with quest
  const canInteractWithQuest = useCallback((quest) => {
    if (!userLoc || !quest) return false;
    const distance = calculateDistance(userLoc.latitude, userLoc.longitude, quest.lat, quest.lng);
    return distance <= QUEST_INTERACTION_RADIUS;
  }, [userLoc]);

  // Combined quests for map display
  const mapQuests = useMemo(() => {
    const quests = [];
    
    // Add spawned (available) quests
    availableQuests.forEach(q => {
      quests.push({
        ...q,
        status: 'available',
        canInteract: canInteractWithQuest(q),
        distance: questDistances[q.id] || null,
      });
    });
    
    // Add active quests
    activeQuests.forEach(q => {
      const loc = EUROPARK_LOCATIONS[q.location];
      if (loc) {
        quests.push({
          ...q,
          lat: loc.lat,
          lng: loc.lng,
          status: 'active',
          canInteract: true,
          distance: userLoc ? Math.round(calculateDistance(userLoc.latitude, userLoc.longitude, loc.lat, loc.lng)) : null,
        });
      }
    });
    
    return quests;
  }, [availableQuests, activeQuests, questDistances, canInteractWithQuest, userLoc]);

  // Get current active quest (for overlay)
  const currentActiveQuest = useMemo(() => {
    if (activeQuests.length === 0) return null;
    // Return the quest with highest priority or nearest
    return activeQuests[0];
  }, [activeQuests]);

  // Update Map when data changes
  useEffect(() => {
    if (mapReady && webviewRef.current) {
      const data = {
        player: userLoc || { latitude: 47.8224, longitude: 13.0456 },
        quests: mapQuests.map(q => ({
          id: q.id,
          lat: q.lat,
          lng: q.lng,
          title: q.title,
          desc: q.description,
          icon: q.icon || 'flag',
          color: q.color || '#4F46E5',
          reward: `${q.xpReward} XP`,
          status: q.status,
          canInteract: q.canInteract,
          distance: q.distance,
          progress: q.progress,
          target: q.target,
        }))
      };
      webviewRef.current.injectJavaScript(`
        if (window.updateMap) {
          window.updateMap(${JSON.stringify(data)});
        }
      `);
    }
  }, [mapReady, userLoc, mapQuests]);

  // Open Quest Detail Sheet
  const openQuestDetail = (quest) => {
    const fullQuest = mapQuests.find(q => q.id === quest.id) || quest;
    setSelectedQuest(fullQuest);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  // Close Detail Sheet
  const closeQuestDetail = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setSelectedQuest(null));
  };

  // Accept Quest
  const acceptQuest = useCallback(() => {
    if (!selectedQuest) return;
    
    if (!canInteractWithQuest(selectedQuest)) {
      Alert.alert(
        'Zu weit entfernt!', 
        `Du musst näher als ${QUEST_INTERACTION_RADIUS}m sein, um diese Quest anzunehmen.`
      );
      return;
    }
    
    // Remove from available and add to active
    setAvailableQuests(prev => prev.filter(q => q.id !== selectedQuest.id));
    
    // Start the quest via game system
    const newQuest = {
      id: `active_${selectedQuest.key}_${Date.now()}`,
      ...selectedQuest,
      startedAt: new Date().toISOString(),
      progress: 0,
    };
    
    dispatch({ type: 'ADD_QUEST', payload: newQuest });
    
    Alert.alert('Quest angenommen!', `"${selectedQuest.title}" wurde gestartet.`);
    closeQuestDetail();
  }, [selectedQuest, canInteractWithQuest, dispatch]);

  // Center on quest
  const centerOnQuest = (quest) => {
    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.setView([${quest.lat}, ${quest.lng}], 18);
        }
      `);
    }
    openQuestDetail(quest);
  };

  // Center on user
  const centerOnUser = () => {
    if (userLoc && webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.setView([${userLoc.latitude}, ${userLoc.longitude}], 18);
        }
      `);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { font-family: -apple-system, system-ui, sans-serif; }
        #map { width: 100%; height: 100vh; background: #F8FAFC; }
        .leaflet-control-attribution, .leaflet-control-zoom { display: none; }
        
        .user-container { position: relative; }
        .user-core { width: 20px; height: 20px; background: #4F46E5; border: 4px solid #FFF; border-radius: 50%; box-shadow: 0 2px 12px rgba(79,70,229,0.5); position: relative; z-index: 2; }
        .user-pulse { position: absolute; top: 50%; left: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(79,70,229,0.2); animation: pulse 2s infinite; }
        .user-range { position: absolute; top: 50%; left: 50%; width: 200px; height: 200px; margin: -100px 0 0 -100px; border-radius: 50%; background: rgba(79,70,229,0.08); border: 2px dashed rgba(79,70,229,0.3); }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

        .quest-container { display: flex; flex-direction: column; align-items: center; transform: translateY(-32px); transition: all 0.3s; cursor: pointer; }
        .quest-container:active { transform: translateY(-30px) scale(0.95); }
        .quest-container.disabled { opacity: 0.5; filter: grayscale(0.5); }
        .quest-container.active { animation: questPulse 2s infinite; }
        @keyframes questPulse { 0%, 100% { transform: translateY(-32px) scale(1); } 50% { transform: translateY(-32px) scale(1.05); } }
        
        .quest-pill { background: #FFF; padding: 6px 10px; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; white-space: nowrap; border: 2px solid; }
        .quest-pill.available { border-color: #10B981; }
        .quest-pill.active { border-color: #4F46E5; background: linear-gradient(135deg, #EEF2FF, #FFF); }
        .quest-pill.locked { border-color: #94A3B8; border-style: dashed; }
        
        .quest-icon { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 8px; font-size: 14px; }
        .quest-info { display: flex; flex-direction: column; }
        .quest-title { font-size: 12px; font-weight: 700; color: #1E293B; }
        .quest-distance { font-size: 10px; color: #64748B; }
        .quest-reward { font-size: 10px; font-weight: 700; background: #F8FAFC; padding: 3px 6px; border-radius: 8px; color: #4F46E5; }
        
        .quest-point { width: 12px; height: 12px; background: #FFF; border: 3px solid; border-radius: 50%; margin-top: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.25); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([47.8224, 13.0456], 17);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        
        const sendMsg = (data) => window.ReactNativeWebView?.postMessage(JSON.stringify(data));

        let playerMarker = null;
        let questMarkers = [];

        window.updateMap = function(data) {
          const { player, quests } = data;

          // Update Player with range indicator
          if (player) {
            const lat = player.latitude || player.lat;
            const lng = player.longitude || player.lng;
            const newLatLng = [lat, lng];

            if (!playerMarker) {
              const playerIcon = L.divIcon({ 
                className: '', 
                html: '<div class="user-container"><div class="user-range"></div><div class="user-pulse"></div><div class="user-core"></div></div>', 
                iconSize: [20,20], 
                iconAnchor: [10,10] 
              });
              playerMarker = L.marker(newLatLng, { icon: playerIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              playerMarker.setLatLng(newLatLng);
            }
          }

          // Update Quests
          questMarkers.forEach(m => map.removeLayer(m));
          questMarkers = [];

          if (quests && Array.isArray(quests)) {
            quests.forEach(q => {
              const statusClass = q.status === 'active' ? 'active' : (q.canInteract ? 'available' : 'locked');
              const distanceText = q.distance ? (q.distance < 1000 ? q.distance + 'm' : (q.distance/1000).toFixed(1) + 'km') : '';
              
              const html = \`
                <div class="quest-container \${statusClass} \${!q.canInteract && q.status !== 'active' ? 'disabled' : ''}">
                  <div class="quest-pill \${statusClass}">
                    <div class="quest-icon" style="background: \${q.color}20; color: \${q.color}">⚔</div>
                    <div class="quest-info">
                      <div class="quest-title">\${q.title}</div>
                      <div class="quest-distance">\${distanceText}</div>
                    </div>
                    <div class="quest-reward">\${q.reward}</div>
                  </div>
                  <div class="quest-point" style="border-color: \${q.color}"></div>
                </div>\`;
              
              const marker = L.marker([q.lat, q.lng], { 
                icon: L.divIcon({ className: '', html: html, iconSize: [160,50], iconAnchor: [80,50] }) 
              }).addTo(map);
              
              marker.on('click', () => sendMsg({ type: 'QUEST_TAP', quest: q }));
              questMarkers.push(marker);
            });
          }
        };

        setTimeout(() => sendMsg({ type: 'MAP_READY' }), 500);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe srcDoc={mapHtml} style={styles.map} title="Quest Map" />
        ) : (
          <WebView 
            ref={webviewRef}
            source={{ html: mapHtml }} 
            style={styles.map}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'MAP_READY') {
                  setMapReady(true);
                } else if (data.type === 'QUEST_TAP') {
                  openQuestDetail(data.quest);
                }
              } catch (e) {
                console.log("Map message error", e);
              }
            }} 
          />
        )}
      </View>

      {/* Active Quest Overlay (Top) */}
      {currentActiveQuest && (
        <TouchableOpacity 
          style={styles.activeQuestOverlay}
          onPress={() => {
            const loc = EUROPARK_LOCATIONS[currentActiveQuest.location];
            if (loc) centerOnQuest({ ...currentActiveQuest, lat: loc.lat, lng: loc.lng });
          }}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.activeQuestGradient}
          >
            <View style={styles.activeQuestIcon}>
              <Ionicons name={currentActiveQuest.icon || 'flag'} size={18} color="#FFF" />
            </View>
            <View style={styles.activeQuestInfo}>
              <Text style={styles.activeQuestLabel}>AKTIVE QUEST</Text>
              <Text style={styles.activeQuestTitle} numberOfLines={1}>{currentActiveQuest.title}</Text>
            </View>
            <View style={styles.activeQuestProgress}>
              <Text style={styles.activeQuestProgressText}>
                {currentActiveQuest.progress || 0}/{currentActiveQuest.target || 1}
              </Text>
            </View>
            <Ionicons name="navigate" size={20} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Ionicons name="compass" size={16} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Quest Map</Text>
            <Text style={styles.headerSub}>{mapQuests.filter(q => q.status === 'available' && q.canInteract).length} Quests verfügbar</Text>
          </View>
        </View>
      </View>

      {/* Available Quests Carousel */}
      {mapQuests.filter(q => q.status === 'available').length > 0 && !selectedQuest && (
        <View style={styles.questCarousel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questRow}>
            {mapQuests.filter(q => q.status === 'available').map((quest) => (
              <TouchableOpacity 
                key={quest.id} 
                style={[
                  styles.questCard,
                  !quest.canInteract && styles.questCardLocked
                ]} 
                activeOpacity={0.9}
                onPress={() => centerOnQuest(quest)}
              >
                <View style={[styles.questCardIcon, { backgroundColor: quest.color + '20' }]}>
                  <Ionicons name={quest.icon || 'flag'} size={20} color={quest.color} />
                </View>
                <View style={styles.questCardInfo}>
                  <Text style={styles.questCardTitle} numberOfLines={1}>{quest.title}</Text>
                  <View style={styles.questCardMeta}>
                    <Text style={styles.questCardDistance}>
                      {quest.distance ? (quest.distance < 1000 ? `${quest.distance}m` : `${(quest.distance/1000).toFixed(1)}km`) : '...'}
                    </Text>
                    <View style={[styles.questCardStatus, quest.canInteract ? styles.statusAvailable : styles.statusLocked]}>
                      <Ionicons 
                        name={quest.canInteract ? 'checkmark-circle' : 'lock-closed'} 
                        size={12} 
                        color={quest.canInteract ? '#10B981' : '#94A3B8'} 
                      />
                      <Text style={[styles.statusText, quest.canInteract ? styles.statusTextAvailable : styles.statusTextLocked]}>
                        {quest.canInteract ? 'Verfügbar' : 'Zu weit'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.questCardReward, { color: quest.color }]}>{quest.xpReward} XP</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.statsGroup}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Aktive Quests</Text>
            <Text style={styles.statValue}>{activeQuests.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>In Reichweite</Text>
            <Text style={styles.statValue}>{mapQuests.filter(q => q.canInteract && q.status === 'available').length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quest Detail Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
        {selectedQuest && (
          <>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedQuest.color + '20' }]}>
                <Ionicons name={selectedQuest.icon || 'flag'} size={32} color={selectedQuest.color} />
              </View>
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>{selectedQuest.title}</Text>
                <Text style={styles.sheetSub}>{selectedQuest.description}</Text>
              </View>
              <TouchableOpacity onPress={closeQuestDetail} style={styles.closeSheet}>
                <Ionicons name="close" size={24} color={COLORS.text.muted} />
              </TouchableOpacity>
            </View>
            
            {/* Quest Stats */}
            <View style={styles.sheetStats}>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>BELOHNUNG</Text>
                <Text style={[styles.sheetStatValue, { color: COLORS.primary }]}>{selectedQuest.xpReward} XP</Text>
              </View>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>ENTFERNUNG</Text>
                <Text style={styles.sheetStatValue}>
                  {selectedQuest.distance ? (selectedQuest.distance < 1000 ? `${selectedQuest.distance}m` : `${(selectedQuest.distance/1000).toFixed(1)}km`) : '...'}
                </Text>
              </View>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>SCHWIERIGKEIT</Text>
                <Text style={styles.sheetStatValue}>{selectedQuest.difficulty || 'Easy'}</Text>
              </View>
            </View>

            {/* Briefing */}
            {selectedQuest.briefing && (
              <View style={styles.briefingBox}>
                <Ionicons name="document-text" size={16} color={COLORS.text.muted} />
                <Text style={styles.briefingText}>{selectedQuest.briefing}</Text>
              </View>
            )}

            {/* Action Button */}
            {selectedQuest.status === 'available' ? (
              <TouchableOpacity 
                style={[
                  styles.sheetBtn, 
                  { backgroundColor: selectedQuest.canInteract ? selectedQuest.color : '#94A3B8' }
                ]} 
                onPress={acceptQuest}
                disabled={!selectedQuest.canInteract}
              >
                {selectedQuest.canInteract ? (
                  <>
                    <Text style={styles.sheetBtnText}>Quest annehmen</Text>
                    <Ionicons name="add-circle" size={20} color="#FFF" />
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                    <Text style={styles.sheetBtnText}>Näher kommen ({selectedQuest.distance}m entfernt)</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.activeQuestBadge}>
                <Ionicons name="play-circle" size={20} color={COLORS.primary} />
                <Text style={styles.activeQuestBadgeText}>Quest läuft - {selectedQuest.progress || 0}/{selectedQuest.target || 1}</Text>
              </View>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%', border: 'none' },
  
  // Active Quest Overlay
  activeQuestOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  activeQuestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    ...SHADOWS.md,
  },
  activeQuestIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeQuestInfo: { flex: 1 },
  activeQuestLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  activeQuestTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  activeQuestProgress: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  activeQuestProgressText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Header
  headerCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 32, height: 32, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  headerSub: { fontSize: 11, color: COLORS.text.secondary, fontWeight: '500' },

  // Quest Carousel
  questCarousel: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 180 : 160,
    left: 0, 
    right: 0 
  },
  questRow: { paddingHorizontal: 20, gap: 12 },
  questCard: {
    width: width * 0.7,
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  questCardLocked: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  questCardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  questCardInfo: { flex: 1 },
  questCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 },
  questCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  questCardDistance: { fontSize: 12, color: COLORS.text.secondary },
  questCardStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusAvailable: { backgroundColor: '#D1FAE5' },
  statusLocked: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextAvailable: { color: '#10B981' },
  statusTextLocked: { color: '#94A3B8' },
  questCardReward: { fontSize: 14, fontWeight: '800' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    paddingLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  statsGroup: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stat: { gap: 2 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', color: COLORS.text.muted, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  locateBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...SHADOWS.xl,
    zIndex: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  sheetIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  sheetSub: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 },
  closeSheet: { padding: 8 },
  
  sheetStats: { flexDirection: 'row', gap: 24, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetStatItem: {},
  sheetStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 0.5, marginBottom: 4 },
  sheetStatValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  
  briefingBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  briefingText: { flex: 1, fontSize: 13, color: COLORS.text.secondary, lineHeight: 20 },
  
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  sheetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  
  activeQuestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 14,
  },
  activeQuestBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

export default MapScreen;
