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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview'; 
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { useGame } from '../game/GameProvider';
import { useQuests } from '../game/hooks';
import { EUROPARK_LOCATIONS, QUEST_TEMPLATES, calculateDistance } from '../game/config/quests';

const { width, height } = Dimensions.get('window');

// Quest interaction radius in meters
const QUEST_INTERACTION_RADIUS = 100;

// Default location (Europark Salzburg)
const DEFAULT_LOCATION = { latitude: 47.8224, longitude: 13.0456 };

// Timeout for location request (ms)
const LOCATION_TIMEOUT = 8000;

const MapScreen = () => {
  const webviewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationWatchId = useRef(null);
  
  // Game Data
  const { updateLocation, dispatch } = useGame();
  const { activeQuests } = useQuests();
  
  // State
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [availableQuests, setAvailableQuests] = useState([]);
  const [questDistances, setQuestDistances] = useState({});
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Pulse animation
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

  // Location tracking - simplified and robust
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const initLocation = () => {
      // Set a timeout to use default location if geolocation takes too long
      timeoutId = setTimeout(() => {
        if (isMounted && isLoadingLocation) {
          console.log('Location timeout, using default');
          setLocationError('Standort konnte nicht ermittelt werden. Standardposition wird verwendet.');
          setUserLoc(DEFAULT_LOCATION);
          generateNearbyQuests(DEFAULT_LOCATION);
          setIsLoadingLocation(false);
        }
      }, LOCATION_TIMEOUT);

      if (Platform.OS === 'web') {
        // Web: Use browser geolocation
        if (!navigator.geolocation) {
          clearTimeout(timeoutId);
          setLocationError('Geolocation nicht unterstützt');
          setUserLoc(DEFAULT_LOCATION);
          generateNearbyQuests(DEFAULT_LOCATION);
          setIsLoadingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;
            clearTimeout(timeoutId);
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLoc(coords);
            updateLocation(coords);
            generateNearbyQuests(coords);
            setIsLoadingLocation(false);
            
            // Start watching
            locationWatchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                if (!isMounted) return;
                const newCoords = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
                setUserLoc(newCoords);
                updateLocation(newCoords);
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 10000 }
            );
          },
          (error) => {
            if (!isMounted) return;
            clearTimeout(timeoutId);
            console.log('Geolocation error:', error);
            setLocationError('Standortberechtigung verweigert');
            setUserLoc(DEFAULT_LOCATION);
            generateNearbyQuests(DEFAULT_LOCATION);
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT - 1000, maximumAge: 60000 }
        );
      } else {
        // Native: Use expo-location
        (async () => {
          try {
            const Location = await import('expo-location');
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (!isMounted) return;
            
            if (status !== 'granted') {
              clearTimeout(timeoutId);
              setLocationError('Standortberechtigung verweigert');
              setUserLoc(DEFAULT_LOCATION);
              generateNearbyQuests(DEFAULT_LOCATION);
              setIsLoadingLocation(false);
              return;
            }
            
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            if (!isMounted) return;
            clearTimeout(timeoutId);
            
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLoc(coords);
            updateLocation(coords);
            generateNearbyQuests(coords);
            setIsLoadingLocation(false);
            
            // Start watching - store subscription differently to avoid the removeSubscription bug
            const subscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Balanced,
                distanceInterval: 10,
              },
              (loc) => {
                if (!isMounted) return;
                const newCoords = {
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                };
                setUserLoc(newCoords);
                updateLocation(newCoords);
              }
            );
            locationWatchId.current = subscription;
          } catch (error) {
            if (!isMounted) return;
            clearTimeout(timeoutId);
            console.log('Location error:', error);
            setLocationError('Standort konnte nicht ermittelt werden');
            setUserLoc(DEFAULT_LOCATION);
            generateNearbyQuests(DEFAULT_LOCATION);
            setIsLoadingLocation(false);
          }
        })();
      }
    };
    
    initLocation();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      
      // Cleanup location watch
      if (Platform.OS === 'web') {
        if (locationWatchId.current !== null) {
          navigator.geolocation.clearWatch(locationWatchId.current);
        }
      } else {
        if (locationWatchId.current && typeof locationWatchId.current.remove === 'function') {
          try {
            locationWatchId.current.remove();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    };
  }, []);

  // Generate quests around user
  const generateNearbyQuests = useCallback((coords) => {
    const questKeys = ['daily_coffee', 'speed_fountain', 'golden_compass', 'fashionista', 'movie_night'];
    const generatedQuests = [];
    
    questKeys.forEach((key) => {
      const template = QUEST_TEMPLATES[key];
      if (!template) return;
      
      let questLat, questLng;
      if (template.location && EUROPARK_LOCATIONS[template.location]) {
        const loc = EUROPARK_LOCATIONS[template.location];
        questLat = loc.lat;
        questLng = loc.lng;
      } else {
        questLat = coords.latitude + (Math.random() - 0.5) * 0.009;
        questLng = coords.longitude + (Math.random() - 0.5) * 0.009;
      }
      
      generatedQuests.push({
        id: `spawn_${key}_${Date.now()}`,
        ...template,
        lat: questLat,
        lng: questLng,
        isSpawned: true,
        progress: 0,
      });
    });
    
    setAvailableQuests(generatedQuests);
  }, []);

  // Update distances to quests
  useEffect(() => {
    if (userLoc && availableQuests.length > 0) {
      const distances = {};
      availableQuests.forEach(quest => {
        const dist = calculateDistance(userLoc.latitude, userLoc.longitude, quest.lat, quest.lng);
        distances[quest.id] = Math.round(dist);
      });
      setQuestDistances(distances);
    }
  }, [userLoc, availableQuests]);

  // Check if user can interact with quest
  const canInteractWithQuest = useCallback((quest) => {
    if (!userLoc || !quest) return false;
    const distance = calculateDistance(userLoc.latitude, userLoc.longitude, quest.lat, quest.lng);
    return distance <= QUEST_INTERACTION_RADIUS;
  }, [userLoc]);

  // Combined quests for map display
  const mapQuests = useMemo(() => {
    const quests = [];
    
    availableQuests.forEach(q => {
      quests.push({
        ...q,
        status: 'available',
        canInteract: canInteractWithQuest(q),
        distance: questDistances[q.id] || null,
      });
    });
    
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
    return activeQuests[0];
  }, [activeQuests]);

  // Update Map when data changes
  useEffect(() => {
    if (mapReady && userLoc) {
      const data = {
        player: userLoc,
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
      
      if (Platform.OS === 'web') {
        const iframe = document.querySelector('iframe[title="Quest Map"]');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'UPDATE_MAP', data }, '*');
        }
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          if (window.updateMap) { window.updateMap(${JSON.stringify(data)}); }
          true;
        `);
      }
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
      Alert.alert('Zu weit entfernt!', `Du musst näher als ${QUEST_INTERACTION_RADIUS}m sein.`);
      return;
    }
    
    setAvailableQuests(prev => prev.filter(q => q.id !== selectedQuest.id));
    
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
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe[title="Quest Map"]');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'CENTER_MAP', lat: quest.lat, lng: quest.lng }, '*');
      }
    } else if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (window.map) { window.map.setView([${quest.lat}, ${quest.lng}], 18); }
        true;
      `);
    }
    openQuestDetail(quest);
  };

  // Center on user
  const centerOnUser = () => {
    if (userLoc) {
      if (Platform.OS === 'web') {
        const iframe = document.querySelector('iframe[title="Quest Map"]');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'CENTER_MAP', lat: userLoc.latitude, lng: userLoc.longitude }, '*');
        }
      } else if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          if (window.map) { window.map.setView([${userLoc.latitude}, ${userLoc.longitude}], 18); }
          true;
        `);
      }
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
        * { margin: 0; padding: 0; }
        body { font-family: -apple-system, system-ui, sans-serif; }
        #map { width: 100%; height: 100vh; background: #F8FAFC; }
        .leaflet-control-attribution, .leaflet-control-zoom { display: none; }
        
        .user-container { position: relative; }
        .user-core { width: 20px; height: 20px; background: #4F46E5; border: 4px solid #FFF; border-radius: 50%; box-shadow: 0 2px 12px rgba(79,70,229,0.5); position: relative; z-index: 2; }
        .user-pulse { position: absolute; top: 50%; left: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(79,70,229,0.2); animation: pulse 2s infinite; }
        .user-range { position: absolute; top: 50%; left: 50%; width: 200px; height: 200px; margin: -100px 0 0 -100px; border-radius: 50%; background: rgba(79,70,229,0.08); border: 2px dashed rgba(79,70,229,0.3); }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

        .quest-container { display: flex; flex-direction: column; align-items: center; transform: translateY(-32px); transition: all 0.3s; cursor: pointer; }
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
        window.map = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        
        const sendMsg = (data) => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          } else {
            window.parent.postMessage(data, '*');
          }
        };

        let playerMarker = null;
        let questMarkers = [];

        window.updateMap = function(data) {
          const { player, quests } = data;

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
              map.setView(newLatLng, 17);
            } else {
              playerMarker.setLatLng(newLatLng);
            }
          }

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

        window.addEventListener('message', function(event) {
          if (event.data.type === 'UPDATE_MAP') {
            window.updateMap(event.data.data);
          } else if (event.data.type === 'CENTER_MAP') {
            map.setView([event.data.lat, event.data.lng], 18);
          }
        });

        setTimeout(() => sendMsg({ type: 'MAP_READY' }), 500);
      </script>
    </body>
    </html>
  `;

  // Handle messages from web iframe
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event) => {
        if (event.data && event.data.type === 'MAP_READY') {
          setMapReady(true);
        } else if (event.data && event.data.type === 'QUEST_TAP') {
          openQuestDetail(event.data.quest);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Bottom padding for navbar
  const navbarHeight = Platform.OS === 'ios' ? 88 : 64;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe 
            srcDoc={mapHtml} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Quest Map" 
          />
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
              } catch (e) {}
            }} 
          />
        )}
      </View>

      {/* Loading Overlay */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Ionicons name="locate" size={24} color={COLORS.primary} />
            <Text style={styles.loadingText}>Standort wird ermittelt...</Text>
          </View>
        </View>
      )}

      {/* Location Error Banner */}
      {locationError && !isLoadingLocation && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity onPress={() => setLocationError(null)}>
            <Ionicons name="close" size={18} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Active Quest Overlay (Top - höher positioniert) */}
      {currentActiveQuest && !isLoadingLocation && (
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

      {/* Available Quests Carousel */}
      {mapQuests.filter(q => q.status === 'available').length > 0 && !selectedQuest && !isLoadingLocation && (
        <View style={[styles.questCarousel, { bottom: navbarHeight + 90 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questRow}>
            {mapQuests.filter(q => q.status === 'available').map((quest) => (
              <TouchableOpacity 
                key={quest.id} 
                style={[styles.questCard, !quest.canInteract && styles.questCardLocked]} 
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
      <View style={[styles.bottomBar, { bottom: navbarHeight + 16 }]}>
        <View style={styles.statsGroup}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Aktiv</Text>
            <Text style={styles.statValue}>{activeQuests.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Erreichbar</Text>
            <Text style={styles.statValue}>{mapQuests.filter(q => q.canInteract && q.status === 'available').length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
          <Ionicons name="locate" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quest Detail Sheet - über Navbar */}
      <Animated.View style={[styles.bottomSheet, { paddingBottom: navbarHeight + 20, transform: [{ translateY: slideAnim }] }]}>
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
                <Text style={styles.sheetStatLabel}>LEVEL</Text>
                <Text style={styles.sheetStatValue}>{selectedQuest.difficulty || 'Easy'}</Text>
              </View>
            </View>

            {selectedQuest.briefing && (
              <View style={styles.briefingBox}>
                <Ionicons name="document-text" size={16} color={COLORS.text.muted} />
                <Text style={styles.briefingText}>{selectedQuest.briefing}</Text>
              </View>
            )}

            {selectedQuest.status === 'available' ? (
              <TouchableOpacity 
                style={[styles.sheetBtn, { backgroundColor: selectedQuest.canInteract ? selectedQuest.color : '#94A3B8' }]} 
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
                    <Ionicons name="walk" size={18} color="#FFF" />
                    <Text style={styles.sheetBtnText}>Noch {selectedQuest.distance}m entfernt</Text>
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
  map: { flex: 1 },
  
  // Loading & Error
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  loadingText: { marginTop: 14, fontSize: 15, color: COLORS.text.secondary, fontWeight: '600' },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20, right: 20,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 10,
    ...SHADOWS.sm,
    zIndex: 50,
  },
  errorText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500' },

  // Active Quest Overlay - ganz oben
  activeQuestOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20, right: 20,
    zIndex: 10,
  },
  activeQuestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    ...SHADOWS.md,
  },
  activeQuestIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeQuestInfo: { flex: 1 },
  activeQuestLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  activeQuestTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginTop: 2 },
  activeQuestProgress: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
  },
  activeQuestProgressText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Quest Carousel
  questCarousel: { 
    position: 'absolute', 
    left: 0, right: 0,
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
  questCardLocked: { opacity: 0.7, borderStyle: 'dashed' },
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
    left: 20, right: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
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
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  locateBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Sheet - über Navbar
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    ...SHADOWS.xl,
    zIndex: 30,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  sheetIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  sheetSub: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 },
  closeSheet: { padding: 6 },
  
  sheetStats: { flexDirection: 'row', gap: 20, marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetStatItem: {},
  sheetStatLabel: { fontSize: 10, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 0.5, marginBottom: 4 },
  sheetStatValue: { fontSize: 17, fontWeight: '800', color: COLORS.text.primary },
  
  briefingBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
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
