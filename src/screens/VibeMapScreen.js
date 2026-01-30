import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Platform,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../theme';
import { useGame } from '../game/GameProvider';
import { useQuests } from '../game/hooks';
import { calculateDistance } from '../game/config/quests';

const { width, height } = Dimensions.get('window');

const QUEST_INTERACTION_RADIUS = 100;
const DEFAULT_LOCATION = { latitude: 47.8224, longitude: 13.0456 };

// Map HTML als Blob URL - wird nur EINMAL erstellt
// Custom map style ohne Straßennamen + Meter-basierte Kreise
const MAP_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}body{font-family:-apple-system,system-ui,sans-serif}
#map{width:100%;height:100vh;background:#F8FAFC}
.leaflet-control-attribution,.leaflet-control-zoom{display:none}
.player-wrapper{position:relative;display:flex;align-items:center;justify-content:center}
.user-core{width:18px;height:18px;background:#4F46E5;border:3px solid #FFF;border-radius:50%;box-shadow:0 2px 10px rgba(79,70,229,0.5);position:relative;z-index:3}
.user-pulse{position:absolute;width:60px;height:60px;border-radius:50%;background:rgba(79,70,229,0.3);animation:pulse 2s ease-out infinite;z-index:1}
.user-pulse2{position:absolute;width:60px;height:60px;border-radius:50%;background:rgba(79,70,229,0.2);animation:pulse 2s ease-out infinite;animation-delay:0.5s;z-index:1}
@keyframes pulse{0%{transform:scale(0.5);opacity:1}100%{transform:scale(2);opacity:0}}
.quest-container{display:flex;flex-direction:column;align-items:center;transform:translateY(-30px);cursor:pointer}
.quest-container.disabled{opacity:0.5;filter:grayscale(0.4)}
.quest-pill{background:#FFF;padding:5px 8px;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.12);display:flex;align-items:center;gap:6px;white-space:nowrap;border:2px solid}
.quest-pill.available{border-color:#10B981}.quest-pill.active{border-color:#4F46E5;background:linear-gradient(135deg,#EEF2FF,#FFF)}.quest-pill.locked{border-color:#94A3B8;border-style:dashed}
.quest-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.quest-title{font-size:11px;font-weight:700;color:#1E293B}.quest-distance{font-size:9px;color:#64748B}
.quest-reward{font-size:9px;font-weight:700;background:#F1F5F9;padding:2px 5px;border-radius:6px;color:#4F46E5}
.quest-point{width:10px;height:10px;background:#FFF;border:3px solid;border-radius:50%;margin-top:6px;box-shadow:0 2px 6px rgba(0,0,0,0.2)}
</style></head><body><div id="map"></div><script>
const map=L.map('map',{zoomControl:false,attributionControl:false}).setView([47.8224,13.0456],17);
window.map=map;
// Positron (no labels) - cleaner map without street names
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{maxZoom:20}).addTo(map);
const sendMsg=d=>{window.ReactNativeWebView?window.ReactNativeWebView.postMessage(JSON.stringify(d)):window.parent.postMessage(d,'*')};
let playerMarker=null,playerCircleRange=null,questMarkers=[];
const INTERACTION_RADIUS=100; // meters
window.updatePlayer=function(player){
const lat=player.latitude||player.lat,lng=player.longitude||player.lng;
if(!playerMarker){
// Range circle (100m) - zoom independent, stays 100m in real world
playerCircleRange=L.circle([lat,lng],{radius:INTERACTION_RADIUS,color:'#4F46E5',weight:2,opacity:0.3,fillColor:'#4F46E5',fillOpacity:0.05,dashArray:'8,8'}).addTo(map);
// Player marker with pulsing animation (CSS-based, centered)
playerMarker=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="player-wrapper"><div class="user-pulse"></div><div class="user-pulse2"></div><div class="user-core"></div></div>',iconSize:[60,60],iconAnchor:[30,30]}),zIndexOffset:1000}).addTo(map);
map.setView([lat,lng],17);
}else{
playerMarker.setLatLng([lat,lng]);
playerCircleRange.setLatLng([lat,lng]);
}
};
window.updateQuests=function(quests){
questMarkers.forEach(m=>map.removeLayer(m));questMarkers=[];
if(quests){quests.forEach(q=>{
const sc=q.status==='active'?'active':q.canInteract?'available':'locked';
const dt=q.distance?(q.distance<1000?q.distance+'m':(q.distance/1000).toFixed(1)+'km'):'';
const h='<div class="quest-container '+(sc==='locked'?' disabled':'')+'"><div class="quest-pill '+sc+'"><div class="quest-icon" style="background:'+q.color+'20;color:'+q.color+'">⚔</div><div><div class="quest-title">'+q.title+'</div><div class="quest-distance">'+dt+'</div></div><div class="quest-reward">'+q.reward+'</div></div><div class="quest-point" style="border-color:'+q.color+'"></div></div>';
const m=L.marker([q.lat,q.lng],{icon:L.divIcon({className:'',html:h,iconSize:[140,45],iconAnchor:[70,45]})}).addTo(map);
m.on('click',()=>sendMsg({type:'QUEST_TAP',quest:q}));questMarkers.push(m);
})}
};
window.addEventListener('message',e=>{
if(e.data.type==='UPDATE_PLAYER')window.updatePlayer(e.data.player);
else if(e.data.type==='UPDATE_QUESTS')window.updateQuests(e.data.quests);
else if(e.data.type==='CENTER_MAP')map.setView([e.data.lat,e.data.lng],18);
});
setTimeout(()=>sendMsg({type:'MAP_READY'}),300);
<\/script></body></html>`;

// Erstelle Blob URL einmalig beim Module-Load
let mapBlobUrl = null;
if (Platform.OS === 'web' && typeof Blob !== 'undefined') {
  const blob = new Blob([MAP_HTML], { type: 'text/html' });
  mapBlobUrl = URL.createObjectURL(blob);
}

const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const locationWatchId = useRef(null);
  const dragStartY = useRef(0);
  
  // PanResponder for draggable bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        dragStartY.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged more than 100px down or velocity is high, close
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, { 
            toValue: height, 
            duration: 200, 
            useNativeDriver: true 
          }).start(() => setSelectedQuest(null));
        } else {
          // Snap back
          Animated.spring(slideAnim, { 
            toValue: 0, 
            useNativeDriver: true 
          }).start();
        }
      },
    })
  ).current;
  
  const { updateLocation, quests: allQuests, locations: allLocations } = useGame();
  const { activeQuests, startQuest } = useQuests();
  
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLoc, setUserLoc] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState('searching');
  const [availableQuests, setAvailableQuests] = useState([]);
  const mapReadyRef = useRef(false);

  // Request location - can be called manually for retry
  const requestLocation = useCallback(() => {
    if (Platform.OS !== 'web') return;
    
    setLocationStatus('searching');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLoc(coords);
        setLocationStatus('found');
        updateLocation(coords);
        
        // Generate quests with new location
        const generatedQuests = (allQuests || []).map((template) => {
          if (!template) return null;
          
          let questLat, questLng;
          
          // Use location from DB if it exists
          if (template.location && allLocations[template.location]) {
            const loc = allLocations[template.location];
            questLat = loc.lat;
            questLng = loc.lng;
          } else {
            // Random location nearby
            questLat = coords.latitude + (Math.random() - 0.5) * 0.008;
            questLng = coords.longitude + (Math.random() - 0.5) * 0.008;
          }
          
          return {
            ...template,
            id: `spawn_${template.key || template.id}_${Date.now()}_${Math.random()}`,
            lat: questLat,
            lng: questLng,
            isSpawned: true,
            progress: 0,
          };
        }).filter(Boolean);
        
        setAvailableQuests(generatedQuests);
      },
      (err) => {
        console.log('Geolocation retry error:', err.code, err.message);
        setLocationStatus(err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  }, [updateLocation]);

  // Generate nearby quests - defined first so it can be used by other hooks
  const generateNearbyQuests = useCallback((coords) => {
    // Check if we have quests loaded
    if (!allQuests || allQuests.length === 0) return;

    const generatedQuests = allQuests.map((template) => {
      let questLat, questLng;
      
      if (template.location && allLocations && allLocations[template.location]) {
        const loc = allLocations[template.location];
        questLat = loc.lat;
        questLng = loc.lng;
      } else {
        questLat = coords.latitude + (Math.random() - 0.5) * 0.008;
        questLng = coords.longitude + (Math.random() - 0.5) * 0.008;
      }
      
      return {
        id: `spawn_${template.key || template.id}_${Date.now()}_${Math.random()}`,
        ...template,
        lat: questLat,
        lng: questLng,
        isSpawned: true,
        progress: 0,
      };
    }).filter(Boolean);
    
    setAvailableQuests(generatedQuests);
  }, [allQuests, allLocations]);

  const canInteractWithQuest = useCallback((quest) => {
    if (!quest) return false;
    const distance = calculateDistance(userLoc.latitude, userLoc.longitude, quest.lat, quest.lng);
    return distance <= QUEST_INTERACTION_RADIUS;
  }, [userLoc]);

  // Berechne mapQuests nur wenn sich availableQuests oder activeQuests ändern
  const mapQuests = useMemo(() => {
    const quests = [];
    
    availableQuests.forEach(q => {
      const dist = calculateDistance(userLoc.latitude, userLoc.longitude, q.lat, q.lng);
      quests.push({
        ...q,
        status: 'available',
        canInteract: dist <= QUEST_INTERACTION_RADIUS,
        distance: Math.round(dist),
      });
    });
    
    activeQuests.forEach(q => {
      const loc = allLocations[q.location];
      if (loc) {
        quests.push({
          ...q,
          lat: loc.lat,
          lng: loc.lng,
          status: 'active',
          canInteract: true,
          distance: Math.round(calculateDistance(userLoc.latitude, userLoc.longitude, loc.lat, loc.lng)),
        });
      }
    });
    
    return quests;
  }, [availableQuests, activeQuests, userLoc, allLocations]);

  const currentActiveQuest = useMemo(() => activeQuests[0] || null, [activeQuests]);

  // Generate quests on mount
  useEffect(() => {
    generateNearbyQuests(DEFAULT_LOCATION);
  }, [generateNearbyQuests]);

  // Request location
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationStatus('error');
        return;
      }
      
      // Delay to let page load
      const timer = setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setUserLoc(coords);
            setLocationStatus('found');
            updateLocation(coords);
            generateNearbyQuests(coords);
            
// Kein kontinuierliches Watching auf Web - zu viele Updates verursachen Flackern
          // Position wird manuell über den Center-Button aktualisiert
          },
          (err) => {
            console.log('Geolocation error:', err.code, err.message);
            setLocationStatus(err.code === 1 ? 'denied' : 'error');
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
        );
      }, 500);
      
      return () => {
        clearTimeout(timer);
        if (locationWatchId.current !== null) {
          navigator.geolocation.clearWatch(locationWatchId.current);
        }
      };
    } else {
      // Native: Use expo-location
      let sub = null;
      (async () => {
        try {
          const Location = await import('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLoc(coords);
            setLocationStatus('found');
            updateLocation(coords);
            generateNearbyQuests(coords);
            
            // Watch position
            sub = await Location.watchPositionAsync(
              { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
              (loc) => {
                setUserLoc({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                });
              }
            );
            locationWatchId.current = sub;
          } else {
            setLocationStatus('denied');
          }
        } catch (e) {
          console.log('Location error:', e);
          setLocationStatus('error');
        }
      })();
      
      return () => {
        if (locationWatchId.current?.remove) {
          try { locationWatchId.current.remove(); } catch (e) {}
        }
      };
    }
  }, [updateLocation, generateNearbyQuests]);

  // Speichere letzte Quest-IDs um unnötige Updates zu vermeiden
  const lastQuestIdsRef = useRef('');
  const lastPlayerPosRef = useRef('');
  
  // Update nur Player Position - sehr oft erlaubt
  useEffect(() => {
    if (!mapReadyRef.current && !mapReady) return;
    
    const posKey = `${userLoc.latitude.toFixed(5)},${userLoc.longitude.toFixed(5)}`;
    if (posKey === lastPlayerPosRef.current) return;
    lastPlayerPosRef.current = posKey;
    
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe[title="Quest Map"]');
      iframe?.contentWindow?.postMessage({ type: 'UPDATE_PLAYER', player: userLoc }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.updatePlayer && window.updatePlayer(${JSON.stringify(userLoc)});true;`);
    }
  }, [mapReady, userLoc]);
  
  // Update Quests - nur wenn sich die Quest-Liste ändert
  useEffect(() => {
    if (!mapReadyRef.current && !mapReady) return;
    
    const questIds = mapQuests.map(q => q.id + q.canInteract).join(',');
    if (questIds === lastQuestIdsRef.current) return;
    lastQuestIdsRef.current = questIds;
    
    const questData = mapQuests.map(q => ({
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
    }));
    
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe[title="Quest Map"]');
      iframe?.contentWindow?.postMessage({ type: 'UPDATE_QUESTS', quests: questData }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.updateQuests && window.updateQuests(${JSON.stringify(questData)});true;`);
    }
  }, [mapReady, mapQuests]);

  const openQuestDetail = (quest) => {
    const fullQuest = mapQuests.find(q => q.id === quest.id) || quest;
    setSelectedQuest(fullQuest);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  const closeQuestDetail = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 200, useNativeDriver: true }).start(() => setSelectedQuest(null));
  };

  const acceptQuest = useCallback(async () => {
    if (!selectedQuest) return;
    if (!canInteractWithQuest(selectedQuest)) {
      Alert.alert('Zu weit!', `Näher als ${QUEST_INTERACTION_RADIUS}m kommen.`);
      return;
    }
    
    // Remove from available quests UI
    setAvailableQuests(prev => prev.filter(q => q.id !== selectedQuest.id));
    
    // Start quest - this saves to Supabase!
    await startQuest(selectedQuest);
    
    Alert.alert('Quest gestartet!', selectedQuest.title);
    closeQuestDetail();
  }, [selectedQuest, canInteractWithQuest, startQuest]);

  const centerOnQuest = (quest) => {
    if (Platform.OS === 'web') {
      document.querySelector('iframe[title="Quest Map"]')?.contentWindow?.postMessage({ type: 'CENTER_MAP', lat: quest.lat, lng: quest.lng }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.map?.setView([${quest.lat}, ${quest.lng}], 18);true;`);
    }
    openQuestDetail(quest);
  };

  const centerOnUser = () => {
    if (Platform.OS === 'web') {
      document.querySelector('iframe[title="Quest Map"]')?.contentWindow?.postMessage({ type: 'CENTER_MAP', lat: userLoc.latitude, lng: userLoc.longitude }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.map?.setView([${userLoc.latitude}, ${userLoc.longitude}], 18);true;`);
    }
  };

  // Web Message Handler - einmal registrieren
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = (e) => {
        if (e.data?.type === 'MAP_READY' && !mapReadyRef.current) {
          mapReadyRef.current = true;
          setMapReady(true);
        } else if (e.data?.type === 'QUEST_TAP') {
          openQuestDetail(e.data.quest);
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, []);

  // Calculate positions based on safe area and navbar
  const topOffset = Platform.OS === 'ios' ? insets.top + 10 : 16;
  // Navbar actual height from AppNavigator
  const bottomBarBottom = Platform.OS === 'ios' ? insets.bottom + 60 : 12;

  return (
    <View style={styles.container}>
      {/* Map - Full Screen - Blob URL für Stabilität */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' && mapBlobUrl ? (
          <iframe 
            src={mapBlobUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Quest Map" 
          />
        ) : Platform.OS !== 'web' ? (
          <WebView 
            ref={webviewRef}
            source={{ html: MAP_HTML }} 
            style={{ flex: 1 }}
            onMessage={(e) => {
              try {
                const d = JSON.parse(e.nativeEvent.data);
                if (d.type === 'MAP_READY' && !mapReadyRef.current) {
                  mapReadyRef.current = true;
                  setMapReady(true);
                } else if (d.type === 'QUEST_TAP') openQuestDetail(d.quest);
              } catch (err) {}
            }} 
          />
        ) : null}
      </View>

      {/* Active Quest Overlay */}
      {currentActiveQuest && (
        <TouchableOpacity 
          style={[styles.activeQuestOverlay, { top: topOffset }]}
          onPress={() => {
            const loc = allLocations[currentActiveQuest.location];
            if (loc) centerOnQuest({ ...currentActiveQuest, lat: loc.lat, lng: loc.lng });
          }}
        >
          <LinearGradient colors={['#4F46E5', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeQuestGradient}>
            <View style={styles.activeQuestIcon}>
              <Ionicons name={currentActiveQuest.icon || 'flag'} size={16} color="#FFF" />
            </View>
            <View style={styles.activeQuestInfo}>
              <Text style={styles.activeQuestLabel}>AKTIVE QUEST</Text>
              <Text style={styles.activeQuestTitle} numberOfLines={1}>{currentActiveQuest.title}</Text>
            </View>
            <View style={styles.activeQuestProgress}>
              <Text style={styles.activeQuestProgressText}>{currentActiveQuest.progress || 0}/{currentActiveQuest.target || 1}</Text>
            </View>
            <Ionicons name="navigate" size={18} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Location Status Banner */}
      {locationStatus !== 'found' && (
        <TouchableOpacity 
          style={[styles.locationIndicator, { top: topOffset + (currentActiveQuest ? 70 : 0) }]}
          onPress={requestLocation}
        >
          <Ionicons 
            name={locationStatus === 'denied' ? 'location-outline' : locationStatus === 'error' ? 'warning-outline' : 'locate-outline'} 
            size={14} 
            color={locationStatus === 'denied' ? '#EF4444' : '#F59E0B'} 
          />
          <Text style={styles.locationText}>
            {locationStatus === 'searching' && 'Standort wird gesucht...'}
            {locationStatus === 'denied' && 'Tippen für Standort-Berechtigung'}
            {locationStatus === 'error' && 'Standort nicht verfügbar - Tippen zum Retry'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quest Carousel */}
      {mapQuests.filter(q => q.status === 'available').length > 0 && !selectedQuest && (
        <View style={[styles.questCarousel, { bottom: bottomBarBottom + 70 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questRow}>
            {mapQuests.filter(q => q.status === 'available').map((quest) => (
              <TouchableOpacity key={quest.id} style={[styles.questCard, !quest.canInteract && styles.questCardLocked]} activeOpacity={0.9} onPress={() => centerOnQuest(quest)}>
                <View style={[styles.questCardIcon, { backgroundColor: quest.color + '20' }]}>
                  <Ionicons name={quest.icon || 'flag'} size={18} color={quest.color} />
                </View>
                <View style={styles.questCardInfo}>
                  <Text style={styles.questCardTitle} numberOfLines={1}>{quest.title}</Text>
                  <View style={styles.questCardMeta}>
                    <Text style={styles.questCardDistance}>{quest.distance ? (quest.distance < 1000 ? `${quest.distance}m` : `${(quest.distance/1000).toFixed(1)}km`) : '...'}</Text>
                    <View style={[styles.questCardStatus, quest.canInteract ? styles.statusAvailable : styles.statusLocked]}>
                      <Ionicons name={quest.canInteract ? 'checkmark-circle' : 'lock-closed'} size={10} color={quest.canInteract ? '#10B981' : '#94A3B8'} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.questCardReward, { color: quest.color }]}>{quest.xpReward}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { bottom: bottomBarBottom }]}>
        <View style={styles.statsGroup}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{activeQuests.length}</Text>
            <Text style={styles.statLabel}>Aktiv</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{mapQuests.filter(q => q.canInteract && q.status === 'available').length}</Text>
            <Text style={styles.statLabel}>Erreichbar</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
          <Ionicons name="locate" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quest Detail Sheet - Draggable */}
      <Animated.View 
        style={[styles.bottomSheet, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 70 : 20, transform: [{ translateY: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        {selectedQuest && (
          <>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedQuest.color + '20' }]}>
                <Ionicons name={selectedQuest.icon || 'flag'} size={28} color={selectedQuest.color} />
              </View>
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>{selectedQuest.title}</Text>
                <Text style={styles.sheetSub} numberOfLines={2}>{selectedQuest.description}</Text>
              </View>
              <TouchableOpacity onPress={closeQuestDetail} style={styles.closeSheet}>
                <Ionicons name="close" size={22} color={COLORS.text.muted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sheetStats}>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>BELOHNUNG</Text>
                <Text style={[styles.sheetStatValue, { color: COLORS.primary }]}>{selectedQuest.xpReward} XP</Text>
              </View>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>ENTFERNUNG</Text>
                <Text style={styles.sheetStatValue}>{selectedQuest.distance ? (selectedQuest.distance < 1000 ? `${selectedQuest.distance}m` : `${(selectedQuest.distance/1000).toFixed(1)}km`) : '-'}</Text>
              </View>
            </View>

            {selectedQuest.status === 'available' ? (
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: selectedQuest.canInteract ? selectedQuest.color : '#94A3B8' }]} onPress={acceptQuest} disabled={!selectedQuest.canInteract}>
                <Text style={styles.sheetBtnText}>{selectedQuest.canInteract ? 'Quest annehmen' : `Noch ${selectedQuest.distance}m`}</Text>
                <Ionicons name={selectedQuest.canInteract ? 'add-circle' : 'walk'} size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.activeQuestBadge}>
                <Ionicons name="play-circle" size={18} color={COLORS.primary} />
                <Text style={styles.activeQuestBadgeText}>Quest läuft</Text>
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
  
  // Location Indicator (small, non-blocking)
  locationIndicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  locationText: { fontSize: 12, color: '#92400E', fontWeight: '500' },

  // Active Quest
  activeQuestOverlay: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  activeQuestGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, ...SHADOWS.md },
  activeQuestIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activeQuestInfo: { flex: 1 },
  activeQuestLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  activeQuestTitle: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 1 },
  activeQuestProgress: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  activeQuestProgressText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Quest Carousel
  questCarousel: { position: 'absolute', left: 0, right: 0 },
  questRow: { paddingHorizontal: 16, gap: 10 },
  questCard: { width: width * 0.65, backgroundColor: '#FFF', padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.md, borderWidth: 1.5, borderColor: '#E2E8F0' },
  questCardLocked: { opacity: 0.6, borderStyle: 'dashed' },
  questCardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questCardInfo: { flex: 1 },
  questCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, marginBottom: 2 },
  questCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questCardDistance: { fontSize: 11, color: COLORS.text.secondary },
  questCardStatus: { flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 4 },
  statusAvailable: { backgroundColor: '#D1FAE5' },
  statusLocked: { backgroundColor: '#F1F5F9' },
  questCardReward: { fontSize: 13, fontWeight: '800' },

  // Bottom Bar
  bottomBar: { position: 'absolute', left: 16, right: 16, backgroundColor: '#FFF', borderRadius: 16, padding: 10, paddingLeft: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg },
  statsGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  statLabel: { fontSize: 10, color: COLORS.text.muted, fontWeight: '500' },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  locateBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  // Bottom Sheet - extra tall to hide edge during animation
  bottomSheet: { position: 'absolute', bottom: -50, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 16, minHeight: 320, ...SHADOWS.xl, zIndex: 30 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  sheetIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginBottom: 2 },
  sheetSub: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  closeSheet: { padding: 4 },
  sheetStats: { flexDirection: 'row', gap: 24, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetStatItem: {},
  sheetStatLabel: { fontSize: 9, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 0.5, marginBottom: 2 },
  sheetStatValue: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  sheetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  activeQuestBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 12 },
  activeQuestBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});

export default MapScreen;
