import React, { useState, useRef } from 'react';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview'; // Import WebView specifically
import { BRAND, COLORS, CATEGORIES, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Open Detail Sheet
  const openSpot = (spot) => {
    setSelectedSpot(spot);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  // Close Detail Sheet
  const closeSpot = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setSelectedSpot(null));
  };

  const activeMissions = [
    { id: 1, title: 'Morning Run', icon: 'walk', progress: 65, color: COLORS.primary },
    { id: 2, title: 'Shopping', icon: 'bag', progress: 20, color: CATEGORIES.shop.color },
  ];

  // Map Logic with Message Bridge
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
        
        .user-core { width: 16px; height: 16px; background: #4F46E5; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 2px 8px rgba(79,70,229,0.4); }
        .user-pulse { position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: rgba(79,70,229,0.15); animation: pulse 3s infinite; }
        @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

        .quest-container { display: flex; flex-direction: column; align-items: center; transform: translateY(-28px); transition: transform 0.2s; cursor: pointer; }
        .quest-container:active { transform: translateY(-26px) scale(0.95); }
        .quest-pill { background: #FFF; padding: 4px 8px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); display: flex; align-items: center; gap: 6px; white-space: nowrap; border: 1px solid rgba(0,0,0,0.04); }
        .quest-icon { display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .quest-info { font-size: 11px; font-weight: 700; color: #1E293B; }
        .quest-timer { font-size: 9px; font-weight: 700; background: #F8FAFC; padding: 2px 5px; border-radius: 6px; color: #64748B; border: 1px solid #F1F5F9; }
        .quest-point { width: 10px; height: 10px; background: #FFF; border: 3px solid; border-radius: 50%; margin-top: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([47.8224, 13.0456], 17);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        
        const sendMsg = (data) => window.ReactNativeWebView?.postMessage(JSON.stringify(data));

        const playerIcon = L.divIcon({ className: '', html: '<div class="user-pulse"></div><div class="user-core"></div>', iconSize: [16,16], iconAnchor: [8,8] });
        L.marker([47.8224, 13.0456], { icon: playerIcon, zIndexOffset: 1000 }).addTo(map);
        
        const quests = [
          { id: 1, lat: 47.8236, lng: 13.0466, title: 'Speed Run', time: '08:45', color: '#EF4444', icon: '⚡️', desc: 'Reach Starbucks in 8 min', reward: '150 XP' },
          { id: 2, lat: 47.8214, lng: 13.0476, title: 'Secret Loot', time: '42:00', color: '#8B5CF6', icon: '💎', desc: 'Hidden QR Code found', reward: '500 XP' },
          { id: 3, lat: 47.8229, lng: 13.0441, title: 'Crowd', time: '2h', color: '#10B981', icon: '👥', desc: 'Social Event at Main Plaza', reward: '300 XP' },
        ];
        
        quests.forEach(q => {
          const html = \`
            <div class="quest-container" onclick='sendMsg(\${JSON.stringify(q)})'>
              <div class="quest-pill">
                <div class="quest-icon" style="color: \${q.color}">\${q.icon}</div>
                <div class="quest-info" style="color: \${q.color}">\${q.title}</div>
                <div class="quest-timer">\${q.time}</div>
              </div>
              <div class="quest-point" style="border-color: \${q.color}"></div>
            </div>\`;
          L.marker([q.lat, q.lng], { icon: L.divIcon({ className: '', html: html, iconSize: [120,40], iconAnchor: [60,40] }) }).addTo(map);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe 
            srcDoc={mapHtml} 
            style={styles.map} 
            title="Clean Map" 
            // On Web, we simulate postMessage via window event or just simple mock
          />
        ) : (
          <WebView 
            source={{ html: mapHtml }} 
            style={styles.map}
            onMessage={(event) => openSpot(JSON.parse(event.nativeEvent.data))} 
          />
        )}
        {/* Mock Click Area for Web Demo since iframe bridge is tricky */}
        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={{position: 'absolute', top: '40%', left: '55%', width: 100, height: 50}} 
            onPress={() => openSpot({title: 'Speed Run', desc: 'Reach Starbucks', color: '#EF4444', icon: '⚡️', reward: '150 XP'})}
          />
        )}
      </View>

      {/* Header */}
      {!isSearching ? (
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}><Ionicons name="pulse" size={16} color="#FFF" /></View>
            <View>
              <Text style={styles.headerTitle}>PULSE</Text>
              <Text style={styles.headerSub}>Live Map</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => setIsSearching(true)}>
            <Ionicons name="search" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.text.muted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search spots, friends..." 
            autoFocus 
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => { setIsSearching(false); setSearchText(''); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Missions Overlay */}
      {!selectedSpot && (
        <View style={styles.missionContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionRow}>
            {activeMissions.map((m) => (
              <TouchableOpacity key={m.id} style={styles.missionCard} activeOpacity={0.9}>
                <View style={[styles.missionIcon, { backgroundColor: m.color + '15' }]}>
                  <Ionicons name={m.icon} size={18} color={m.color} />
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{m.title}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${m.progress}%`, backgroundColor: m.color }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.statsGroup}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Crowd</Text>
            <View style={styles.crowdBadge}>
              <View style={styles.crowdDot} /><Text style={styles.crowdText}>Moderate</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Nearby</Text>
            <Text style={styles.statValue}>12 Spots</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scanFab} activeOpacity={0.9} onPress={() => setIsScanning(true)}>
          <Ionicons name="scan" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* SPOT DETAIL SHEET */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
        {selectedSpot && (
          <>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: selectedSpot.color + '20' }]}>
                <Text style={{fontSize: 24}}>{selectedSpot.icon}</Text>
              </View>
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>{selectedSpot.title}</Text>
                <Text style={styles.sheetSub}>{selectedSpot.desc}</Text>
              </View>
              <TouchableOpacity onPress={closeSpot} style={styles.closeSheet}>
                <Ionicons name="close" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetStats}>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>REWARD</Text>
                <Text style={[styles.sheetStatValue, { color: COLORS.primary }]}>{selectedSpot.reward}</Text>
              </View>
              <View style={styles.sheetStatItem}>
                <Text style={styles.sheetStatLabel}>DISTANCE</Text>
                <Text style={styles.sheetStatValue}>120m</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: selectedSpot.color }]}>
              <Text style={styles.sheetBtnText}>Navigate</Text>
              <Ionicons name="navigate" size={16} color="#FFF" />
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* SCAN MODAL */}
      <Modal visible={isScanning} animationType="slide" transparent>
        <View style={styles.scanOverlay}>
          <TouchableOpacity style={styles.scanClose} onPress={() => setIsScanning(false)}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, {top:0, left:0, borderTopWidth:4, borderLeftWidth:4}]} />
            <View style={[styles.corner, {top:0, right:0, borderTopWidth:4, borderRightWidth:4}]} />
            <View style={[styles.corner, {bottom:0, left:0, borderBottomWidth:4, borderLeftWidth:4}]} />
            <View style={[styles.corner, {bottom:0, right:0, borderBottomWidth:4, borderRightWidth:4}]} />
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.scanText}>Scanning Environment...</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%', border: 'none' },
  
  headerCard: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...SHADOWS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 32, height: 32, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: COLORS.text.secondary, fontWeight: '500' },
  searchBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },

  searchBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20,
    backgroundColor: '#FFF', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOWS.md,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text.primary },

  missionContainer: { position: 'absolute', top: 130, left: 0, right: 0 },
  missionRow: { paddingHorizontal: 20, gap: 12 },
  missionCard: {
    width: width * 0.6, backgroundColor: '#FFF', padding: 12, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.surfaceAlt,
  },
  missionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  missionInfo: { flex: 1 },
  missionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginBottom: 6 },
  progressTrack: { height: 4, backgroundColor: COLORS.surfaceAlt, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  bottomBar: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 20, right: 20,
    backgroundColor: '#FFF', borderRadius: 24, padding: 8, paddingLeft: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg,
  },
  statsGroup: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stat: { gap: 2 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', color: COLORS.text.muted, fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  crowdBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crowdDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  crowdText: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  scanFab: {
    width: 52, height: 52, borderRadius: 20, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...SHADOWS.xl, zIndex: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  sheetIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text.primary },
  sheetSub: { fontSize: 14, color: COLORS.text.secondary, marginTop: 4 },
  closeSheet: { padding: 8 },
  sheetStats: { flexDirection: 'row', gap: 40, marginBottom: 24 },
  sheetStatLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text.muted, marginBottom: 4 },
  sheetStatValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  sheetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Scan Overlay
  scanOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  scanClose: { position: 'absolute', top: 60, right: 30, padding: 10 },
  scanFrame: { width: 250, height: 250, position: 'relative', marginBottom: 40 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.primary },
  scanLine: { width: '100%', height: 2, backgroundColor: COLORS.primary, position: 'absolute', top: '50%', opacity: 0.8 },
  scanText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default MapScreen;
