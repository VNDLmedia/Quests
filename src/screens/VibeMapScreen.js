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
import { COLORS, SHADOWS, PALETTE } from '../theme';
import { useGame } from '../game/GameProvider';
import { useQuests } from '../game/hooks';
import { calculateDistance } from '../game/config/quests';
import { LocationService } from '../game/services/LocationService';
import { processQRCode } from '../game/services/QRScannerService';
import QuestCompletionModal from '../components/QuestCompletionModal';
import StaticPresentationMap from '../components/StaticPresentationMap';
import POIModal from '../components/POIModal';
import POICompletionModal from '../components/POICompletionModal';
import POICreationModal from '../components/POICreationModal';
import PresentationQuestCreationModal from '../components/PresentationQuestCreationModal';
import {
  isPresentationModeActive,
  getPresentationSettings,
  getPresentationPOIs,
  getUserPOIProgress,
  recordPOIScan,
  createPOI,
} from '../game/services/PresentationModeService';
import {
  createPresentationQuest,
  fetchPresentationQuests,
  fetchUserPresentationQuestProgress,
} from '../game/services/QuestCreationService';

// Safe import for QR Scanner
let UniversalQRScanner = null;
try {
  if (Platform.OS === 'web') {
    UniversalQRScanner = require('../components/UniversalQRScanner').default;
  }
} catch (error) {
  // console.warn('UniversalQRScanner not available:', error);
}

const { width, height } = Dimensions.get('window');

const QUEST_INTERACTION_RADIUS = 100;
const DEFAULT_LOCATION = { latitude: 47.8224, longitude: 13.0456 };

// Dark theme Leaflet map with Eternal Path brand colors
const MAP_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}
body{font-family:-apple-system,system-ui,sans-serif}
#map{width:100%;height:100vh;background:#0D1B2A}
.leaflet-control-attribution,.leaflet-control-zoom{display:none}
/* Dark blue night theme with no labels */
.leaflet-tile-pane{opacity:1}
.leaflet-tile-container img{
  filter:brightness(0.45) contrast(1.2) saturate(0.6) hue-rotate(210deg);
}
/* Strong navy tint to inject brand palette */
#map::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(8,15,26,0.6);pointer-events:none;z-index:400;mix-blend-mode:multiply}

/* Player marker with golden glow */
.player-wrapper{position:relative;width:60px;height:60px;display:flex;align-items:center;justify-content:center}
.user-core{width:18px;height:18px;background:#E8B84A;border:3px solid #0D1B2A;border-radius:50%;box-shadow:0 0 16px rgba(232,184,74,0.6),0 2px 8px rgba(0,0,0,0.4);position:relative;z-index:3}
.user-pulse{position:absolute;top:50%;left:50%;width:60px;height:60px;border-radius:50%;background:rgba(232,184,74,0.25);animation:pulse 2s ease-out infinite;z-index:1;transform:translate(-50%,-50%) scale(0.5)}
.user-pulse2{position:absolute;top:50%;left:50%;width:60px;height:60px;border-radius:50%;background:rgba(232,184,74,0.15);animation:pulse 2s ease-out infinite;animation-delay:0.5s;z-index:1;transform:translate(-50%,-50%) scale(0.5)}
@keyframes pulse{0%{transform:translate(-50%,-50%) scale(0.5);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}

/* Quest markers */
.quest-container{display:flex;flex-direction:column;align-items:center;transform:translateY(-30px);cursor:pointer}
.quest-container.disabled{opacity:0.5;filter:grayscale(0.4)}
.quest-pill{background:#1B2838;padding:6px 10px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;white-space:nowrap;border:1px solid}
.quest-pill.available{border-color:rgba(93,173,226,0.5);background:linear-gradient(135deg,#1B2838,#243447)}
.quest-pill.active{border-color:rgba(232,184,74,0.6);background:linear-gradient(135deg,#243447,#2D4156);box-shadow:0 0 20px rgba(232,184,74,0.2)}
.quest-pill.completed{border-color:rgba(46,204,113,0.6);background:linear-gradient(135deg,#1B3828,#243847);box-shadow:0 0 12px rgba(46,204,113,0.15)}
.quest-pill.locked{border-color:rgba(107,125,143,0.3);border-style:dashed}
.quest-icon{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.quest-title{font-size:11px;font-weight:700;color:#FFFFFF}
.quest-distance{font-size:9px;color:#B8C5D3}
.quest-reward{font-size:9px;font-weight:700;background:rgba(232,184,74,0.15);padding:3px 6px;border-radius:6px;color:#E8B84A}
.quest-reward.completed{background:rgba(46,204,113,0.15);color:#2ECC71}
.quest-point{width:10px;height:10px;background:#1B2838;border:3px solid;border-radius:50%;margin-top:6px;box-shadow:0 2px 8px rgba(0,0,0,0.4)}
</style></head><body><div id="map"></div><script>
const map=L.map('map',{zoomControl:false,attributionControl:false}).setView([47.8224,13.0456],17);
window.map=map;
// CartoDB Voyager (no labels) - clean night map base
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',{
  maxZoom:20,
  attribution:'',
  subdomains:'abcd'
}).addTo(map);
const sendMsg=d=>{window.ReactNativeWebView?window.ReactNativeWebView.postMessage(JSON.stringify(d)):window.parent.postMessage(d,'*')};
let playerMarker=null,playerCircleRange=null,questMarkers=[];
const INTERACTION_RADIUS=100;
window.updatePlayer=function(player){
const lat=player.latitude||player.lat,lng=player.longitude||player.lng;
if(!playerMarker){
// Range circle with golden glow
playerCircleRange=L.circle([lat,lng],{radius:INTERACTION_RADIUS,color:'#E8B84A',weight:2,opacity:0.4,fillColor:'#E8B84A',fillOpacity:0.06,dashArray:'8,8'}).addTo(map);
// Player marker with pulsing gold animation
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
const sc=q.status==='completed'?'completed':q.status==='active'?'active':q.canInteract?'available':'locked';
const dt=q.distance?(q.distance<1000?q.distance+'m':(q.distance/1000).toFixed(1)+'km'):'';
const iconBg=q.status==='completed'?'rgba(46,204,113,0.2)':q.status==='active'?'rgba(232,184,74,0.2)':'rgba(93,173,226,0.2)';
const iconColor=q.status==='completed'?'#2ECC71':q.status==='active'?'#E8B84A':'#5DADE2';
const questIcon=q.status==='completed'?'✓':'⚔';
const pointColor=q.status==='completed'?'#2ECC71':q.status==='active'?'#E8B84A':'#5DADE2';
const rewardClass=q.status==='completed'?' completed':'';
const h='<div class="quest-container '+(sc==='locked'?' disabled':'')+'"><div class="quest-pill '+sc+'"><div class="quest-icon" style="background:'+iconBg+';color:'+iconColor+'">'+questIcon+'</div><div><div class="quest-title">'+q.title+'</div><div class="quest-distance">'+dt+'</div></div><div class="quest-reward'+rewardClass+'">'+(q.status==='completed'?'Done':q.reward)+'</div></div><div class="quest-point" style="border-color:'+pointColor+'"></div></div>';
const m=L.marker([q.lat,q.lng],{icon:L.divIcon({className:'',html:h,iconSize:[150,50],iconAnchor:[75,50]})}).addTo(map);
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

// Create Blob URL once at module load
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
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        dragStartY.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(slideAnim, { 
            toValue: height, 
            duration: 200, 
            useNativeDriver: true 
          }).start(() => setSelectedQuest(null));
        } else {
          Animated.spring(slideAnim, { 
            toValue: 0, 
            useNativeDriver: true 
          }).start();
        }
      },
    })
  ).current;
  
  const { updateLocation, quests: allQuests, locations: allLocations, player, completeQuest, addScore, user } = useGame();
  const { activeQuests, completedQuests, startQuest } = useQuests();
  const userId = user?.id || player?.id || player?.odooId || player?.odoo_id;
  
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLoc, setUserLoc] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState('searching');
  const [availableQuests, setAvailableQuests] = useState([]);
  const [followUser, setFollowUser] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningQuest, setScanningQuest] = useState(null);
  const [completionModalData, setCompletionModalData] = useState(null);
  const mapReadyRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationSettings, setPresentationSettings] = useState(null);
  const [presentationPOIs, setPresentationPOIs] = useState([]);
  const [scannedPOIIds, setScannedPOIIds] = useState([]);
  const [currentPOI, setCurrentPOI] = useState(null);
  const [showPOIModal, setShowPOIModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [isAddingPOI, setIsAddingPOI] = useState(false);
  const [newPOIPosition, setNewPOIPosition] = useState(null);
  const [showPOICreationModal, setShowPOICreationModal] = useState(false);
  
  // Presentation Quest State
  const [presentationQuests, setPresentationQuests] = useState([]);
  const [completedQuestIds, setCompletedQuestIds] = useState([]);
  const [activeQuestIds, setActiveQuestIds] = useState([]);
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [showQuestCreationModal, setShowQuestCreationModal] = useState(false);

  // Generate nearby quests - defined first to avoid circular dependency
  const generateNearbyQuests = useCallback((coords) => {
    if (!allQuests || allQuests.length === 0) return;

    const generatedQuests = allQuests.map((template) => {
      let questLat, questLng;
      
      // Priority: metadata coordinates > location reference > skip quest
      if (template.metadata?.lat && template.metadata?.lng) {
        // Use exact coordinates from quest metadata (admin-created quests)
        questLat = template.metadata.lat;
        questLng = template.metadata.lng;
      } else if (template.location && allLocations && allLocations[template.location]) {
        // Use location reference
        const loc = allLocations[template.location];
        questLat = loc.lat;
        questLng = loc.lng;
      } else {
        // Skip quests without valid coordinates
        // console.log('[VibeMapScreen] Quest has no coordinates:', template.title);
        return null;
      }
      
      return {
        id: template.id || `quest_${Date.now()}`,
        ...template,
        lat: questLat,
        lng: questLng,
        isSpawned: true,
        progress: 0,
      };
    }).filter(Boolean);
    
    setAvailableQuests(generatedQuests);
  }, [allQuests, allLocations]);

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
        generateNearbyQuests(coords);
      },
      (err) => {
        // console.log('Geolocation retry error:', err.code, err.message);
        setLocationStatus(err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [updateLocation, generateNearbyQuests]);

  const canInteractWithQuest = useCallback((quest) => {
    if (!quest || !quest.lat || !quest.lng) return false;
    const distance = calculateDistance(userLoc.latitude, userLoc.longitude, quest.lat, quest.lng);
    return distance <= QUEST_INTERACTION_RADIUS;
  }, [userLoc]);

  const mapQuests = useMemo(() => {
    const quests = [];
    
    // Get IDs of active and completed quests to filter them out from available
    const activeQuestIds = new Set(activeQuests.map(q => q.questId || q.id));
    const completedQuestIds = new Set((completedQuests || []).map(q => q.questId || q.id));
    
    // Available quests (not started yet) - exclude active and completed
    availableQuests.forEach(q => {
      if (!q.lat || !q.lng) return; // Skip quests without coordinates
      if (activeQuestIds.has(q.id) || completedQuestIds.has(q.id)) return; // Skip if already active or completed
      
      const dist = calculateDistance(userLoc.latitude, userLoc.longitude, q.lat, q.lng);
      quests.push({
        ...q,
        status: 'available',
        canInteract: dist <= QUEST_INTERACTION_RADIUS,
        distance: Math.round(dist),
      });
    });
    
    // Active quests (in progress)
    activeQuests.forEach(q => {
      // Get coordinates from location or metadata
      const loc = allLocations[q.location];
      const questLat = loc?.lat || q.lat || q.metadata?.lat;
      const questLng = loc?.lng || q.lng || q.metadata?.lng;
      
      if (questLat && questLng) {
        quests.push({
          ...q,
          lat: questLat,
          lng: questLng,
          status: 'active',
          canInteract: true,
          distance: Math.round(calculateDistance(userLoc.latitude, userLoc.longitude, questLat, questLng)),
        });
      }
    });
    
    // Completed quests (show with checkmark)
    (completedQuests || []).forEach(q => {
      const loc = allLocations[q.location];
      // Also check metadata for coordinates
      const questLat = loc?.lat || q.metadata?.latitude || q.lat;
      const questLng = loc?.lng || q.metadata?.longitude || q.lng;
      if (questLat && questLng) {
        quests.push({
          ...q,
          lat: questLat,
          lng: questLng,
          status: 'completed',
          canInteract: false,
          distance: Math.round(calculateDistance(userLoc.latitude, userLoc.longitude, questLat, questLng)),
        });
      }
    });
    
    return quests;
  }, [availableQuests, activeQuests, completedQuests, userLoc, allLocations]);

  const currentActiveQuest = useMemo(() => activeQuests[0] || null, [activeQuests]);

  // Load last known location on startup for quick map display
  useEffect(() => {
    const loadInitialLocation = async () => {
      const lastLocation = await LocationService.getLastKnownLocation();
      if (lastLocation && isInitialLoadRef.current) {
        setUserLoc({
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        });
        generateNearbyQuests(lastLocation);
        // console.log('[VibeMapScreen] Loaded last known location:', lastLocation.latitude, lastLocation.longitude);
      }
    };
    loadInitialLocation();
  }, []);

  // Check Presentation Mode and load data
  useEffect(() => {
    const checkPresentationMode = async () => {
      try {
        const isActive = await isPresentationModeActive();
        setIsPresentationMode(isActive);

        if (isActive) {
          // Load presentation settings
          const { data: settings } = await getPresentationSettings();
          setPresentationSettings(settings);

          // Load POIs
          const { data: pois } = await getPresentationPOIs();
          setPresentationPOIs(pois);

          // Load Presentation Quests
          const questsResult = await fetchPresentationQuests();
          let loadedQuests = [];
          if (questsResult.success) {
            loadedQuests = questsResult.quests;
            setPresentationQuests(loadedQuests);
          }

          // Load user's progress
          if (userId) {
            // POI progress
            const progress = await getUserPOIProgress(userId);
            setScannedPOIIds(progress.scannedIds);
            
            // Quest progress - only for presentation quests
            const presentationQuestIds = loadedQuests.map(q => q.id);
            const questProgress = await fetchUserPresentationQuestProgress(userId, presentationQuestIds);
            if (questProgress.success) {
              setCompletedQuestIds(Array.from(questProgress.completed));
              setActiveQuestIds(Array.from(questProgress.active));
            }
          }
        }
      } catch (error) {
        console.error('Error checking presentation mode:', error);
      }
    };

    checkPresentationMode();
    // Refresh every 30 seconds to catch auto-activation
    const interval = setInterval(checkPresentationMode, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle POI tap on static map
  const handlePOIPress = useCallback(async (poi) => {
    // Open QR scanner to scan this POI
    setScanningQuest(null);
    setShowQRScanner(true);
  }, []);

  // Handle POI scan completion
  const handlePOIScanComplete = useCallback(async (poi, progress, completionData) => {
    setCurrentPOI(poi);
    setShowPOIModal(true);

    // Update local scanned IDs
    setScannedPOIIds(prev => [...prev, poi.id]);

    // If all POIs complete, prepare completion modal data
    if (progress?.allComplete && completionData) {
      setCompletionData(completionData);
    }
  }, []);

  // Handle POI modal close
  const handlePOIModalComplete = useCallback(() => {
    setShowPOIModal(false);
    setCurrentPOI(null);

    // Show completion modal if all POIs are done
    if (completionData) {
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 500);
    }
  }, [completionData]);

  // Admin: Handle add POI button
  const handleAddPOIPress = useCallback((position) => {
    if (position === null) {
      // Toggle adding mode
      setIsAddingPOI(prev => !prev);
      setNewPOIPosition(null);
    } else {
      // Position was tapped
      setNewPOIPosition(position);
      setIsAddingPOI(false);
      setShowPOICreationModal(true);
    }
  }, []);

  // Admin: Save new POI
  const handleSavePOI = useCallback(async (poiData) => {
    try {
      const result = await createPOI(poiData, userId);
      if (result.success) {
        // Refresh POIs
        const { data: pois } = await getPresentationPOIs();
        setPresentationPOIs(pois);
        Alert.alert('Erfolg', 'POI wurde erstellt!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating POI:', error);
      Alert.alert('Fehler', 'POI konnte nicht erstellt werden');
    }
  }, [userId]);

  // Admin: Handle add Quest button on presentation map
  const handleAddQuestPress = useCallback((position) => {
    if (position === null) {
      // Toggle adding mode
      setIsAddingQuest(prev => !prev);
      setIsAddingPOI(false); // Cancel POI adding mode if active
    } else {
      // Position was tapped - open quest creation modal
      setIsAddingQuest(false);
      setShowQuestCreationModal(true);
    }
  }, []);

  // Admin: Save new Presentation Quest
  const handleSavePresentationQuest = useCallback(async (questData) => {
    try {
      console.log('[VibeMapScreen] Creating presentation quest:', questData);
      const result = await createPresentationQuest(questData);
      
      if (result.success) {
        // Refresh quests
        const questsResult = await fetchPresentationQuests();
        if (questsResult.success) {
          setPresentationQuests(questsResult.quests);
        }
        Alert.alert('Erfolg', 'Quest wurde erstellt!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating presentation quest:', error);
      Alert.alert('Fehler', error.message || 'Quest konnte nicht erstellt werden');
      throw error; // Re-throw so modal knows it failed
    }
  }, []);

  // Handle quest tap on presentation map
  const handlePresentationQuestPress = useCallback(async (quest) => {
    // Open QR scanner to scan this quest's QR code
    console.log('[VibeMapScreen] Quest tapped:', quest.title);
    setScanningQuest(quest);
    setShowQRScanner(true);
  }, []);

  useEffect(() => {
    generateNearbyQuests(DEFAULT_LOCATION);
  }, [generateNearbyQuests]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationStatus('error');
        return;
      }
      
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
          },
          (err) => {
            // console.log('Geolocation error:', err.code, err.message);
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
          // console.log('Location error:', e);
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

  const lastQuestIdsRef = useRef('');
  const lastPlayerPosRef = useRef('');
  
  useEffect(() => {
    if (!mapReadyRef.current && !mapReady) return;
    
    const posKey = `${userLoc.latitude.toFixed(5)},${userLoc.longitude.toFixed(5)}`;
    if (posKey === lastPlayerPosRef.current) return;
    lastPlayerPosRef.current = posKey;
    
    // Update player marker on map
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe[title="Quest Map"]');
      iframe?.contentWindow?.postMessage({ type: 'UPDATE_PLAYER', player: userLoc }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.updatePlayer && window.updatePlayer(${JSON.stringify(userLoc)});true;`);
    }
    
    // Auto-center on user if follow mode is enabled
    if (followUser && !isInitialLoadRef.current) {
      if (Platform.OS === 'web') {
        const iframe = document.querySelector('iframe[title="Quest Map"]');
        iframe?.contentWindow?.postMessage({ type: 'CENTER_MAP', lat: userLoc.latitude, lng: userLoc.longitude }, '*');
      } else {
        webviewRef.current?.injectJavaScript(`window.map?.setView([${userLoc.latitude}, ${userLoc.longitude}], window.map.getZoom());true;`);
      }
    }
    
    // Mark initial load as done
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
    
    // Save location to LocationService
    LocationService.saveLastKnownLocation(userLoc);
  }, [mapReady, userLoc, followUser]);
  
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
      color: q.color || COLORS.secondary,
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
      Alert.alert('Too far!', `Get closer than ${QUEST_INTERACTION_RADIUS}m.`);
      return;
    }
    
    // Keep the quest data with coordinates for active quests display
    const questWithCoords = {
      ...selectedQuest,
      lat: selectedQuest.lat,
      lng: selectedQuest.lng,
      metadata: {
        ...selectedQuest.metadata,
        lat: selectedQuest.lat,
        lng: selectedQuest.lng,
      }
    };
    
    // Don't manually remove from availableQuests - let mapQuests useMemo filter it out
    // once it appears in activeQuests to avoid marker disappearing
    await startQuest(questWithCoords);
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

  // Open QR Scanner for quest completion
  const openQRScanner = useCallback((quest) => {
    setScanningQuest(quest);
    setShowQRScanner(true);
  }, []);

  // Handle QR code scan result
  const handleQRScanned = useCallback(async ({ data }) => {
    if (!data) return;
    
    // console.log('[VibeMapScreen] QR scanned:', data);
    setShowQRScanner(false);
    
    try {
      const result = await processQRCode(data.trim(), userId);
      // console.log('[VibeMapScreen] QR result:', result);
      
      // Handle POI scan (presentation mode)
      if (result.type === 'poi') {
        if (result.success) {
          // POI scanned successfully - show video/info modal
          handlePOIScanComplete(result.poi, result.progress, result.completionData);
        } else if (result.alreadyScanned) {
          // Already scanned this POI
          if (Platform.OS === 'web') {
            window.alert(result.error || 'Diese Station wurde bereits besucht');
          } else {
            Alert.alert('Bereits besucht', result.error || 'Diese Station wurde bereits besucht');
          }
        } else {
          const errorMsg = result.error || 'Fehler beim Scannen';
          if (Platform.OS === 'web') {
            window.alert(errorMsg);
          } else {
            Alert.alert('Fehler', errorMsg);
          }
        }
        setScanningQuest(null);
        return;
      }
      
      // Handle Presentation Quest (POI) scan
      if (result.type === 'presentation_quest') {
        if (result.success) {
          // POI completed successfully! Show completion modal with image
          const quest = result.quest;
          const questTitle = quest?.title || '';
          
          // Build image URL from quest title (stored in /public/img/)
          const imageUrl = questTitle ? `/img/${questTitle}.jpeg` : null;
          
          // Show completion modal with image
          setCompletionModalData({
            quest: quest,
            rewards: {
              score: quest?.xp_reward || 100,
              card: null,
            },
            infoContent: {
              title: questTitle,
              text: quest?.description || '',
              image_url: imageUrl,
            },
          });
          
          // Refresh presentation quests to update the map
          if (isPresentationMode) {
            const refreshedQuests = await fetchPresentationQuests();
            if (refreshedQuests.success) {
              setPresentationQuests(refreshedQuests.quests || []);
              
              // Update completed IDs
              const poiIds = refreshedQuests.quests?.map(q => q.id) || [];
              if (poiIds.length > 0) {
                const progressResult = await fetchUserPresentationQuestProgress(userId, poiIds);
                if (progressResult.success && progressResult.completed) {
                  setCompletedQuestIds(Array.from(progressResult.completed));
                }
              }
            }
          }
        } else {
          // Already scanned or error
          const errorMsg = result.error || 'Fehler beim Scannen';
          if (Platform.OS === 'web') {
            alert(errorMsg);
          } else {
            Alert.alert('Hinweis', errorMsg);
          }
        }
        setScanningQuest(null);
        return;
      }
      
      // Handle Quest scan (only if we were scanning a quest)
      if (result.success && result.type === 'quest' && scanningQuest) {
        // Quest completed successfully!
        const rewards = result.rewards || { xp: scanningQuest.xpReward, gems: scanningQuest.gemReward };
        const infoContent = result.quest?.metadata?.info_content || scanningQuest.metadata?.info_content;
        
        // Get the actual quest template ID (from quests table) for questline tracking
        // result.quest is from the quests table, scanningQuest might be from user_quests
        const questTemplateId = result.quest?.id || scanningQuest.questId || scanningQuest.id;
        console.log('[VibeMapScreen] Quest completed - template ID:', questTemplateId, 'scanningQuest ID:', scanningQuest.id);
        
        // Mark quest as completed - this awards score and card automatically
        // Pass questTemplateId as second arg to ensure questline tracking uses correct ID
        let questResult = null;
        if (completeQuest) {
          questResult = await completeQuest(scanningQuest.id || scanningQuest.questId, questTemplateId);
        }
        
        // Show completion modal with score and card rewards
        setCompletionModalData({
          quest: scanningQuest,
          rewards: {
            score: questResult?.score || 10,
            card: questResult?.card || null,
          },
          infoContent,
        });
        
        // Close quest detail sheet
        closeQuestDetail();
      } else if (result.success && result.type === 'quest' && !scanningQuest) {
        // Quest scanned directly without selecting it first
        const successMsg = result.message || `Quest "${result.quest?.title}" abgeschlossen!`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Quest abgeschlossen!', successMsg);
        }
      } else if (!result.success) {
        // Wrong code or error
        const errorMsg = result.error || 'Wrong QR code. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } catch (error) {
      console.error('[VibeMapScreen] QR scan error:', error);
      const errorMsg = error.message || 'Error processing QR code';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Fehler', errorMsg);
      }
    }
    
    setScanningQuest(null);
  }, [scanningQuest, userId, completeQuest, handlePOIScanComplete]);

  // Close completion modal
  const closeCompletionModal = useCallback(() => {
    setCompletionModalData(null);
  }, []);

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

  const topOffset = Platform.OS === 'ios' ? insets.top + 10 : 16;
  const bottomBarBottom = Platform.OS === 'ios' ? insets.bottom + 60 : 12;

  // Presentation Mode Rendering
  if (isPresentationMode && presentationSettings) {
    return (
      <View style={styles.container}>
        {/* Static Map with POIs and Quests */}
        <StaticPresentationMap
          imageUrl={presentationSettings.static_map_image_url}
          // POI props
          pois={presentationPOIs}
          scannedPoiIds={scannedPOIIds}
          onPoiPress={handlePOIPress}
          // Quest props
          quests={presentationQuests}
          completedQuestIds={completedQuestIds}
          activeQuestIds={activeQuestIds}
          onQuestPress={handlePresentationQuestPress}
          // Admin props
          isAdmin={player?.admin}
          onAdminPoiPress={handlePOIPress}
          onAddPoiPress={player?.admin ? handleAddPOIPress : null}
          isAddingPoi={isAddingPOI}
          onAddQuestPress={player?.admin ? handleAddQuestPress : null}
          isAddingQuest={isAddingQuest}
        />

        {/* Scan Button for Presentation Mode */}
        <View style={[styles.scanButtonContainer, { bottom: insets.bottom + 60 }]}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowQRScanner(true)}
          >
            <LinearGradient
              colors={COLORS.gradients.gold}
              style={styles.scanButtonGradient}
            >
              <Ionicons name="qr-code" size={24} color={COLORS.text.primary} />
              <Text style={styles.scanButtonText}>Scannen</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* QR Scanner Modal */}
        {showQRScanner && Platform.OS === 'web' && UniversalQRScanner && (
          <View style={styles.scannerOverlay}>
            <UniversalQRScanner 
              onScan={handleQRScanned} 
              onClose={() => {
                setShowQRScanner(false);
                setScanningQuest(null);
              }} 
            />
          </View>
        )}

        {/* POI Video/Info Modal */}
        <POIModal
          visible={showPOIModal}
          poi={currentPOI}
          onComplete={handlePOIModalComplete}
          onClose={() => {
            setShowPOIModal(false);
            setCurrentPOI(null);
          }}
        />

        {/* All POIs Complete Modal */}
        <POICompletionModal
          visible={showCompletionModal}
          title={completionData?.title || 'Alle Stationen gefunden!'}
          text={completionData?.text || 'Herzlichen Glückwunsch!'}
          hintText={completionData?.secretHint}
          imageUrl={completionData?.imageUrl}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletionData(null);
          }}
        />

        {/* Admin: POI Creation Modal */}
        {player?.admin && (
          <POICreationModal
            visible={showPOICreationModal}
            position={newPOIPosition}
            onClose={() => {
              setShowPOICreationModal(false);
              setNewPOIPosition(null);
            }}
            onSave={handleSavePOI}
          />
        )}

        {/* Admin: Presentation Quest Creation Modal */}
        {player?.admin && (
          <PresentationQuestCreationModal
            visible={showQuestCreationModal}
            mapImageUrl={presentationSettings.static_map_image_url}
            onClose={() => {
              setShowQuestCreationModal(false);
              setIsAddingQuest(false);
            }}
            onSave={handleSavePresentationQuest}
            userId={userId}
          />
        )}

        {/* Quest Completion Modal */}
        <QuestCompletionModal
          visible={!!completionModalData}
          quest={completionModalData?.quest}
          rewards={completionModalData?.rewards}
          infoContent={completionModalData?.infoContent}
          onClose={() => setCompletionModalData(null)}
        />
      </View>
    );
  }

  // Normal Map Rendering
  return (
    <View style={styles.container}>
      {/* Map - Full Screen */}
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
          <LinearGradient colors={COLORS.gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.activeQuestGradient}>
            <View style={styles.activeQuestIcon}>
              <Ionicons name={currentActiveQuest.icon || 'flag'} size={16} color={COLORS.text.primary} />
            </View>
            <View style={styles.activeQuestInfo}>
              <Text style={styles.activeQuestLabel}>ACTIVE QUEST</Text>
              <Text style={styles.activeQuestTitle} numberOfLines={1}>{currentActiveQuest.title}</Text>
            </View>
            <View style={styles.activeQuestProgress}>
              <Text style={styles.activeQuestProgressText}>{currentActiveQuest.progress || 0}/{currentActiveQuest.target || 1}</Text>
            </View>
            <Ionicons name="navigate" size={18} color={COLORS.text.primary} />
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
            color={locationStatus === 'denied' ? COLORS.error : COLORS.warning} 
          />
          <Text style={styles.locationText}>
            {locationStatus === 'searching' && 'Finding your location...'}
            {locationStatus === 'denied' && 'Tap to enable location'}
            {locationStatus === 'error' && 'Location unavailable - Tap to retry'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quest Carousel */}
      {mapQuests.filter(q => q.status === 'available').length > 0 && !selectedQuest && (
        <View style={[styles.questCarousel, { bottom: bottomBarBottom + 70 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questRow}>
            {mapQuests.filter(q => q.status === 'available').map((quest) => (
              <TouchableOpacity key={quest.id} style={[styles.questCard, !quest.canInteract && styles.questCardLocked]} activeOpacity={0.9} onPress={() => centerOnQuest(quest)}>
                <View style={[styles.questCardIcon, { backgroundColor: quest.canInteract ? 'rgba(93,173,226,0.15)' : 'rgba(107,125,143,0.1)' }]}>
                  <Ionicons name={quest.icon || 'flag'} size={18} color={quest.canInteract ? COLORS.secondary : COLORS.text.muted} />
                </View>
                <View style={styles.questCardInfo}>
                  <Text style={styles.questCardTitle} numberOfLines={1}>{quest.title}</Text>
                  <View style={styles.questCardMeta}>
                    <Text style={styles.questCardDistance}>{quest.distance ? (quest.distance < 1000 ? `${quest.distance}m` : `${(quest.distance/1000).toFixed(1)}km`) : '...'}</Text>
                    <View style={[styles.questCardStatus, quest.canInteract ? styles.statusAvailable : styles.statusLocked]}>
                      <Ionicons name={quest.canInteract ? 'checkmark-circle' : 'lock-closed'} size={10} color={quest.canInteract ? COLORS.success : COLORS.text.muted} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.questCardReward, { color: COLORS.primary }]}>{quest.xpReward}</Text>
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
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{mapQuests.filter(q => q.canInteract && q.status === 'available').length}</Text>
            <Text style={styles.statLabel}>Nearby</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.locateBtn, followUser && styles.locateBtnActive]} 
          onPress={() => {
            // Smart button: Always center on user, toggle follow mode
            centerOnUser();
            setFollowUser(!followUser);
          }}
          onLongPress={() => {
            // Long press: Just toggle follow without centering
            setFollowUser(!followUser);
          }}
        >
          <Ionicons 
            name={followUser ? 'navigate' : 'locate'} 
            size={20} 
            color={followUser ? COLORS.text.primary : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Quest Detail Sheet */}
      <Animated.View 
        style={[styles.bottomSheet, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 70 : 20, transform: [{ translateY: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        {selectedQuest && (
          <>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedQuest.canInteract ? 'rgba(93,173,226,0.15)' : 'rgba(107,125,143,0.1)' }]}>
                <Ionicons name={selectedQuest.icon || 'flag'} size={28} color={selectedQuest.canInteract ? COLORS.secondary : COLORS.text.muted} />
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
                <Text style={styles.sheetStatLabel}>REWARD</Text>
                <Text style={[styles.sheetStatValue, { color: COLORS.primary }]}>{selectedQuest.xpReward} XP</Text>
              </View>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>DISTANCE</Text>
                <Text style={styles.sheetStatValue}>{selectedQuest.distance ? (selectedQuest.distance < 1000 ? `${selectedQuest.distance}m` : `${(selectedQuest.distance/1000).toFixed(1)}km`) : '-'}</Text>
              </View>
            </View>

            {selectedQuest.status === 'available' ? (
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: selectedQuest.canInteract ? COLORS.primary : COLORS.text.muted }]} onPress={acceptQuest} disabled={!selectedQuest.canInteract}>
                <Text style={[styles.sheetBtnText, { color: selectedQuest.canInteract ? COLORS.text.primary : COLORS.text.primary }]}>{selectedQuest.canInteract ? 'Accept Quest' : `${selectedQuest.distance}m away`}</Text>
                <Ionicons name={selectedQuest.canInteract ? 'add-circle' : 'walk'} size={18} color={COLORS.text.primary} />
              </TouchableOpacity>
            ) : selectedQuest.status === 'active' ? (
              <TouchableOpacity 
                style={[styles.sheetBtn, { backgroundColor: COLORS.primary }]} 
                onPress={() => openQRScanner(selectedQuest)}
              >
                <Ionicons name="qr-code" size={20} color={COLORS.text.primary} />
                <Text style={styles.sheetBtnText}>Scan QR Code</Text>
              </TouchableOpacity>
            ) : selectedQuest.status === 'completed' ? (
              <View style={styles.completedQuestBadge}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.completedQuestBadgeText}>Quest completed</Text>
              </View>
            ) : (
              <View style={styles.activeQuestBadge}>
                <Ionicons name="play-circle" size={18} color={COLORS.primary} />
                <Text style={styles.activeQuestBadgeText}>Quest in progress</Text>
              </View>
            )}
          </>
        )}
      </Animated.View>

      {/* QR Scanner Modal */}
      {showQRScanner && Platform.OS === 'web' && UniversalQRScanner && (
        <View style={styles.scannerOverlay}>
          <UniversalQRScanner 
            onScan={handleQRScanned} 
            onClose={() => {
              setShowQRScanner(false);
              setScanningQuest(null);
            }} 
          />
        </View>
      )}

      {/* Quest Completion Modal */}
      <QuestCompletionModal
        visible={!!completionModalData}
        quest={completionModalData?.quest}
        rewards={completionModalData?.rewards}
        infoContent={completionModalData?.infoContent}
        onClose={closeCompletionModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark },

  // Presentation Mode Scan Button
  scanButtonContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  
  // Location Indicator
  locationIndicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  locationText: { fontSize: 12, color: COLORS.text.secondary, fontWeight: '500' },

  // Active Quest
  activeQuestOverlay: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  activeQuestGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, ...SHADOWS.md },
  activeQuestIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(13,27,42,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activeQuestInfo: { flex: 1 },
  activeQuestLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  activeQuestTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginTop: 1 },
  activeQuestProgress: { backgroundColor: 'rgba(13,27,42,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  activeQuestProgressText: { fontSize: 12, fontWeight: '700', color: COLORS.text.primary },

  // Quest Carousel
  questCarousel: { position: 'absolute', left: 0, right: 0 },
  questRow: { paddingHorizontal: 16, gap: 10 },
  questCard: { width: width * 0.65, backgroundColor: COLORS.surface, padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  questCardLocked: { opacity: 0.6, borderStyle: 'dashed' },
  questCardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questCardInfo: { flex: 1 },
  questCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, marginBottom: 2 },
  questCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questCardDistance: { fontSize: 11, color: COLORS.text.secondary },
  questCardStatus: { flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 4 },
  statusAvailable: { backgroundColor: 'rgba(46,204,113,0.15)' },
  statusLocked: { backgroundColor: 'rgba(107,125,143,0.1)' },
  questCardReward: { fontSize: 13, fontWeight: '800' },

  // Bottom Bar
  bottomBar: { position: 'absolute', left: 16, right: 16, backgroundColor: COLORS.surface, borderRadius: 16, padding: 10, paddingLeft: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg },
  statsGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  statLabel: { fontSize: 10, color: COLORS.text.muted, fontWeight: '500' },
  divider: { width: 1, height: 24, backgroundColor: COLORS.borderLight },
  locateBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(232,184,74,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,184,74,0.2)' },
  locateBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  // Bottom Sheet
  bottomSheet: { position: 'absolute', bottom: -50, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 16, minHeight: 320, ...SHADOWS.xl, zIndex: 30, borderWidth: 1, borderColor: COLORS.borderLight, borderBottomWidth: 0 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.text.muted, alignSelf: 'center', marginBottom: 16, opacity: 0.3 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  sheetIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginBottom: 2 },
  sheetSub: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 18 },
  closeSheet: { padding: 4 },
  sheetStats: { flexDirection: 'row', gap: 24, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sheetStatItem: {},
  sheetStatLabel: { fontSize: 9, fontWeight: '700', color: COLORS.text.muted, letterSpacing: 0.5, marginBottom: 2 },
  sheetStatValue: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  sheetBtnText: { color: COLORS.text.primary, fontWeight: '700', fontSize: 15 },
  activeQuestBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(232,184,74,0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,184,74,0.2)' },
  activeQuestBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  completedQuestBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(46,204,113,0.1)', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(46,204,113,0.2)' },
  completedQuestBadgeText: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  scannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
});

export default MapScreen;
