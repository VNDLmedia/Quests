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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview'; 
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../theme';
import { useGame } from '../game/GameProvider';
import { useQuests } from '../game/hooks';
import { calculateDistance } from '../game/config/quests';

const { width, height } = Dimensions.get('window');

const QUEST_INTERACTION_RADIUS = 100;
// Europa-Park actual GPS coordinates (center of park)
const DEFAULT_LOCATION = { latitude: 48.2680, longitude: 7.7215 };

// Europa-Park Custom Map Configuration
// Tiles scraped from their interactive map - zoom levels 2-7
const PARK_MAP_CONFIG = {
  minZoom: 2,
  maxZoom: 7,
  defaultZoom: 4,
  // Map dimensions at max zoom (z=7)
  width: 15104,
  height: 19456
};

// Map HTML - Full calibration system with rotation, scale, and opacity
const MAP_HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}body{font-family:-apple-system,system-ui,sans-serif}
#map{width:100%;height:100vh;background:#6C9746}
.leaflet-control-attribution,.leaflet-control-zoom{display:none}
.leaflet-tile-pane {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
.leaflet-tile {
  will-change: transform;
  transform: scale(1.002);
  backface-visibility: hidden;
}
.user-core{width:18px;height:18px;background:#4F46E5;border:3px solid #FFF;border-radius:50%;box-shadow:0 2px 10px rgba(79,70,229,0.5);position:relative;z-index:2}
.user-pulse{position:absolute;top:50%;left:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:rgba(79,70,229,0.2);animation:pulse 2s infinite}
.user-range{position:absolute;top:50%;left:50%;width:160px;height:160px;margin:-80px 0 0 -80px;border-radius:50%;background:rgba(79,70,229,0.06);border:2px dashed rgba(79,70,229,0.25)}
@keyframes pulse{0%{transform:scale(0.5);opacity:0}50%{opacity:1}100%{transform:scale(1.5);opacity:0}}
.quest-container{display:flex;flex-direction:column;align-items:center;cursor:pointer}
.quest-container.disabled{opacity:0.5;filter:grayscale(0.4)}
.quest-pill{background:#FFF;padding:5px 8px;border-radius:12px;box-shadow:0 3px 12px rgba(0,0,0,0.12);display:flex;align-items:center;gap:6px;white-space:nowrap;border:2px solid}
.quest-pill.available{border-color:#10B981}.quest-pill.active{border-color:#4F46E5;background:linear-gradient(135deg,#EEF2FF,#FFF)}.quest-pill.locked{border-color:#94A3B8;border-style:dashed}
.quest-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
.quest-title{font-size:11px;font-weight:700;color:#1E293B}.quest-distance{font-size:9px;color:#64748B}
.quest-reward{font-size:9px;font-weight:700;background:#F1F5F9;padding:2px 5px;border-radius:6px;color:#4F46E5}
.quest-point{width:10px;height:10px;background:#FFF;border:3px solid;border-radius:50%;margin-top:6px;box-shadow:0 2px 6px rgba(0,0,0,0.2)}
#calibration{position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.9);color:#fff;padding:12px;border-radius:8px;font-size:11px;z-index:9999;font-family:monospace;max-height:90vh;overflow-y:auto}
#calibration label{display:block;margin:5px 0}
#calibration input[type=range]{width:100px;vertical-align:middle}
#calibration input[type=number]{width:50px;background:#333;color:#fff;border:1px solid #555;padding:2px 4px;border-radius:3px;margin-left:4px}
#calibration .section{margin-top:10px;padding-top:8px;border-top:1px solid #444}
#calibration .section-title{font-weight:bold;color:#4F9;margin-bottom:6px}
#calibration button{background:#4F46E5;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;margin:2px;font-size:10px}
#calibration button:hover{background:#6366F1}
#calibration button.active{background:#10B981}
.ref-point{width:12px;height:12px;background:#FF3366;border:2px solid #FFF;border-radius:50%;box-shadow:0 2px 6px rgba(255,51,102,0.5)}
.ref-label{background:rgba(255,51,102,0.9);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;white-space:nowrap;margin-top:4px}
</style></head><body>
<!-- GPS CALIBRATION PANEL - COMMENTED OUT
<div id="calibration">
  <strong>GPS Calibration</strong>
  
  <div class="section">
    <div class="section-title">Pivot (Rotation Center)</div>
    <label>Pivot X: <input type="range" id="pivotX" min="-1" max="2" value="0.45565" step="0.0001"> <input type="number" id="valPivotX" value="0.45565" step="0.0001"></label>
    <label>Pivot Y: <input type="range" id="pivotY" min="-1" max="2" value="-0.0584" step="0.0001"> <input type="number" id="valPivotY" value="-0.0584" step="0.0001"></label>
  </div>
  <div class="section">
    <div class="section-title">Transform</div>
    <label>Rotation: <input type="range" id="rotation" min="-180" max="180" value="91" step="0.1"> <input type="number" id="valRotation" value="91" step="0.1">°</label>
    <label>Scale X: <input type="range" id="scaleX" min="0.2" max="2" value="0.597" step="0.001"> <input type="number" id="valScaleX" value="0.597" step="0.001"></label>
    <label>Scale Y: <input type="range" id="scaleY" min="0.2" max="2" value="0.467" step="0.001"> <input type="number" id="valScaleY" value="0.467" step="0.001"></label>
  </div>
  
  <div class="section">
    <div class="section-title">Offset</div>
    <label>X: <input type="range" id="offsetX" min="-200" max="200" value="53.1" step="0.1"> <input type="number" id="valX" value="53.1" step="0.1"></label>
    <label>Y: <input type="range" id="offsetY" min="-200" max="200" value="-100.4" step="0.1"> <input type="number" id="valY" value="-100.4" step="0.1"></label>
  </div>
  
  <div class="section">
    <div class="section-title">Tile Opacity</div>
    <label>Opacity: <input type="range" id="tileOpacity" min="0" max="100" value="100" step="5"> <input type="number" id="valOpacity" value="100" step="5">%</label>
  </div>
  
  <div class="section">
    <div class="section-title">Reference Points</div>
    <button id="toggleRefPoints">Show Ref Points</button>
    <button id="toggleGrid">Show Grid</button>
  </div>
  
  <div style="margin-top:10px;font-size:9px;color:#888">
    <div>Current values:</div>
    <div id="currentValues" style="color:#4F9">rot:0 sX:1 sY:1 oX:25.2 oY:-142</div>
  </div>
</div>
-->
<div id="map"></div><script>
// CORRECT coordinate system for L.CRS.Simple with Europa-Park tiles
// Key insight: L.CRS.Simple tile calc is tileX = floor(x * 2^z / 256)
// So coordinates must be SMALL to produce valid tile indices

// Our tile counts at each zoom level
const TILE_INFO = {
  2: { x: 2, y: 3 },
  3: { x: 4, y: 5 },
  4: { x: 8, y: 10 },
  5: { x: 15, y: 19 },
  6: { x: 30, y: 38 },
  7: { x: 59, y: 76 }
};

// Coordinate space based on zoom 5 (native view level)
const MAP_WIDTH = 120;
const MAP_HEIGHT = 152;

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 2,
  maxZoom: 7,
  zoomControl: false,
  attributionControl: false
});

// Simple tile layer - NO Y-flip, direct passthrough
L.TileLayer.EuropaPark = L.TileLayer.extend({
  getTileUrl: function(coords) {
    const z = coords.z;
    const info = TILE_INFO[z];
    if (!info) return '';
    
    const x = coords.x;
    const y = coords.y;
    
    if (x < 0 || x >= info.x || y < 0 || y >= info.y) {
      return '';
    }
    
    return this._url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
  }
});

const tileLayer = new L.TileLayer.EuropaPark('TILE_BASE_URL/{z}/{x}/{y}.png', {
  minZoom: 2,
  maxZoom: 7,
  tileSize: 256,
  noWrap: true,
  opacity: 1
}).addTo(map);

// Map bounds
const mapBounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
map.fitBounds(mapBounds);
map.setZoom(5);

function debugLog(msg) {
  console.log('[Map]', msg);
}

window.map = map;

const sendMsg = d => {
  window.ReactNativeWebView ? window.ReactNativeWebView.postMessage(JSON.stringify(d)) : window.parent.postMessage(d, '*');
};

// GPS to Map Coordinate Conversion
const GPS_BOUNDS = {
  minLat: 48.2620, maxLat: 48.2740,
  minLng: 7.7140, maxLng: 7.7320
};

// ============================================
// CALIBRATION PARAMETERS
// ============================================
let pivotX = 0.45565;  // rotation center X
let pivotY = -0.0584;  // rotation center Y
let rotation = 91;     // degrees
let scaleX = 0.597;    // horizontal scale
let scaleY = 0.467;    // vertical scale
let offsetX = 53.1;    // X translation
let offsetY = -100.4;  // Y translation
let tileOpacity = 100; // tile opacity percentage

// Reference points for calibration (known GPS -> known map locations)
const REFERENCE_POINTS = [
  { name: 'Entrance', lat: 48.2680, lng: 7.7220, desc: 'Main Gate' },
  { name: 'Silver Star', lat: 48.2660, lng: 7.7240, desc: 'Coaster' },
  { name: 'Blue Fire', lat: 48.2650, lng: 7.7190, desc: 'Coaster' },
  { name: 'Wodan', lat: 48.2670, lng: 7.7180, desc: 'Coaster' }
];

let refPointMarkers = [];
let gridLines = [];
let showRefPoints = false;
let showGrid = false;

// Update display of current calibration values
function updateValuesDisplay() {
  const el = document.getElementById('currentValues');
  if (el) {
    el.textContent = 'piv:' + pivotX.toFixed(2) + ',' + pivotY.toFixed(2) + ' rot:' + rotation.toFixed(1) + '° sX:' + scaleX.toFixed(3) + ' sY:' + scaleY.toFixed(3) + ' oX:' + offsetX.toFixed(1) + ' oY:' + offsetY.toFixed(1);
  }
}

// Apply all calibration changes
function applyCalibration() {
  updateValuesDisplay();
  if (window.lastPlayerPos) window.updatePlayer(window.lastPlayerPos);
  if (window.lastQuests) window.updateQuests(window.lastQuests);
  updateRefPoints();
  updateGrid();
}

// ============================================
// GPS -> Map Coords Transformation
// ============================================
function gpsToPixel(lat, lng) {
  // 1. Convert GPS to normalized 0-1 range
  const xPct = (lng - GPS_BOUNDS.minLng) / (GPS_BOUNDS.maxLng - GPS_BOUNDS.minLng);
  const yPct = (lat - GPS_BOUNDS.minLat) / (GPS_BOUNDS.maxLat - GPS_BOUNDS.minLat);
  
  // 2. Center coordinates around pivot for rotation
  const cx = xPct - pivotX;
  const cy = yPct - pivotY;
  
  // 3. Apply rotation around pivot
  const rad = rotation * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = cx * cos - cy * sin;
  const ry = cx * sin + cy * cos;
  
  // 4. Scale to map coordinates (add pivot back, then scale)
  const x = (rx + pivotX) * MAP_WIDTH * scaleX;
  const y = (ry + pivotY) * MAP_HEIGHT * scaleY;
  
  // 5. Apply offset
  const finalX = x + offsetX;
  const finalY = y + offsetY;
  
  return [finalY, finalX];
}

// ============================================
// CALIBRATION UI EVENT HANDLERS
// ============================================

/* CALIBRATION UI EVENT HANDLERS - COMMENTED OUT
// Pivot X
document.getElementById('pivotX').addEventListener('input', function(e) {
  pivotX = parseFloat(e.target.value) || 0.5;
  document.getElementById('valPivotX').value = pivotX;
  applyCalibration();
});
document.getElementById('valPivotX').addEventListener('change', function(e) {
  pivotX = parseFloat(e.target.value) || 0.5;
  document.getElementById('pivotX').value = pivotX;
  applyCalibration();
});

// Pivot Y
document.getElementById('pivotY').addEventListener('input', function(e) {
  pivotY = parseFloat(e.target.value) || 0.5;
  document.getElementById('valPivotY').value = pivotY;
  applyCalibration();
});
document.getElementById('valPivotY').addEventListener('change', function(e) {
  pivotY = parseFloat(e.target.value) || 0.5;
  document.getElementById('pivotY').value = pivotY;
  applyCalibration();
});

// Rotation
document.getElementById('rotation').addEventListener('input', function(e) {
  rotation = parseFloat(e.target.value) || 0;
  document.getElementById('valRotation').value = rotation;
  applyCalibration();
});
document.getElementById('valRotation').addEventListener('change', function(e) {
  rotation = parseFloat(e.target.value) || 0;
  document.getElementById('rotation').value = rotation;
  applyCalibration();
});

// Scale X
document.getElementById('scaleX').addEventListener('input', function(e) {
  scaleX = parseFloat(e.target.value) || 1;
  document.getElementById('valScaleX').value = scaleX;
  applyCalibration();
});
document.getElementById('valScaleX').addEventListener('change', function(e) {
  scaleX = parseFloat(e.target.value) || 1;
  document.getElementById('scaleX').value = scaleX;
  applyCalibration();
});

// Scale Y
document.getElementById('scaleY').addEventListener('input', function(e) {
  scaleY = parseFloat(e.target.value) || 1;
  document.getElementById('valScaleY').value = scaleY;
  applyCalibration();
});
document.getElementById('valScaleY').addEventListener('change', function(e) {
  scaleY = parseFloat(e.target.value) || 1;
  document.getElementById('scaleY').value = scaleY;
  applyCalibration();
});

// Offset X
document.getElementById('offsetX').addEventListener('input', function(e) {
  offsetX = parseFloat(e.target.value) || 0;
  document.getElementById('valX').value = offsetX;
  applyCalibration();
});
document.getElementById('valX').addEventListener('change', function(e) {
  offsetX = parseFloat(e.target.value) || 0;
  document.getElementById('offsetX').value = offsetX;
  applyCalibration();
});

// Offset Y
document.getElementById('offsetY').addEventListener('input', function(e) {
  offsetY = parseFloat(e.target.value) || 0;
  document.getElementById('valY').value = offsetY;
  applyCalibration();
});
document.getElementById('valY').addEventListener('change', function(e) {
  offsetY = parseFloat(e.target.value) || 0;
  document.getElementById('offsetY').value = offsetY;
  applyCalibration();
});

// Tile Opacity
document.getElementById('tileOpacity').addEventListener('input', function(e) {
  tileOpacity = parseFloat(e.target.value) || 100;
  document.getElementById('valOpacity').value = tileOpacity;
  tileLayer.setOpacity(tileOpacity / 100);
});
document.getElementById('valOpacity').addEventListener('change', function(e) {
  tileOpacity = parseFloat(e.target.value) || 100;
  document.getElementById('tileOpacity').value = tileOpacity;
  tileLayer.setOpacity(tileOpacity / 100);
});
*/

// ============================================
// REFERENCE POINTS & GRID
// ============================================

function updateRefPoints() {
  // Remove existing markers
  refPointMarkers.forEach(m => map.removeLayer(m));
  refPointMarkers = [];
  
  if (!showRefPoints) return;
  
  REFERENCE_POINTS.forEach(pt => {
    const [y, x] = gpsToPixel(pt.lat, pt.lng);
    const marker = L.marker([y, x], {
      icon: L.divIcon({
        className: '',
        html: '<div style="display:flex;flex-direction:column;align-items:center"><div class="ref-point"></div><div class="ref-label">' + pt.name + '</div></div>',
        iconSize: [60, 30],
        iconAnchor: [30, 6]
      }),
      zIndexOffset: 2000
    }).addTo(map);
    refPointMarkers.push(marker);
  });
}

function updateGrid() {
  // Remove existing grid
  gridLines.forEach(l => map.removeLayer(l));
  gridLines = [];
  
  if (!showGrid) return;
  
  // Draw N-S and E-W lines through the GPS center
  const centerLat = (GPS_BOUNDS.minLat + GPS_BOUNDS.maxLat) / 2;
  const centerLng = (GPS_BOUNDS.minLng + GPS_BOUNDS.maxLng) / 2;
  
  // N-S line (constant longitude, varying latitude)
  const nsPoints = [];
  for (let lat = GPS_BOUNDS.minLat; lat <= GPS_BOUNDS.maxLat; lat += 0.001) {
    const [y, x] = gpsToPixel(lat, centerLng);
    nsPoints.push([y, x]);
  }
  const nsLine = L.polyline(nsPoints, { color: '#FF3366', weight: 2, dashArray: '5,5', opacity: 0.8 }).addTo(map);
  gridLines.push(nsLine);
  
  // E-W line (constant latitude, varying longitude)
  const ewPoints = [];
  for (let lng = GPS_BOUNDS.minLng; lng <= GPS_BOUNDS.maxLng; lng += 0.001) {
    const [y, x] = gpsToPixel(centerLat, lng);
    ewPoints.push([y, x]);
  }
  const ewLine = L.polyline(ewPoints, { color: '#33AAFF', weight: 2, dashArray: '5,5', opacity: 0.8 }).addTo(map);
  gridLines.push(ewLine);
  
  // Add N/S/E/W labels
  const [nY, nX] = gpsToPixel(GPS_BOUNDS.maxLat, centerLng);
  const [sY, sX] = gpsToPixel(GPS_BOUNDS.minLat, centerLng);
  const [eY, eX] = gpsToPixel(centerLat, GPS_BOUNDS.maxLng);
  const [wY, wX] = gpsToPixel(centerLat, GPS_BOUNDS.minLng);
  
  const labelStyle = 'background:rgba(0,0,0,0.7);color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;font-size:12px';
  
  [['N', nY, nX], ['S', sY, sX], ['E', eY, eX], ['W', wY, wX]].forEach(([dir, y, x]) => {
    const m = L.marker([y, x], {
      icon: L.divIcon({
        className: '',
        html: '<div style="' + labelStyle + '">' + dir + '</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      }),
      zIndexOffset: 1500
    }).addTo(map);
    gridLines.push(m);
  });
}

/* Toggle buttons - COMMENTED OUT
document.getElementById('toggleRefPoints').addEventListener('click', function() {
  showRefPoints = !showRefPoints;
  this.classList.toggle('active', showRefPoints);
  this.textContent = showRefPoints ? 'Hide Ref Points' : 'Show Ref Points';
  updateRefPoints();
});

document.getElementById('toggleGrid').addEventListener('click', function() {
  showGrid = !showGrid;
  this.classList.toggle('active', showGrid);
  this.textContent = showGrid ? 'Hide Grid' : 'Show Grid';
  updateGrid();
});
*/

let playerMarker = null, questMarkers = [];

window.updatePlayer = function(player) {
  const lat = player.latitude || player.lat;
  const lng = player.longitude || player.lng;
  window.lastPlayerPos = player; // Save for calibration updates
  const [y, x] = gpsToPixel(lat, lng);
  
  debugLog('Player: ' + lat.toFixed(4) + ',' + lng.toFixed(4) + ' -> ' + Math.round(y) + ',' + Math.round(x));
  
  if (!playerMarker) {
    playerMarker = L.marker([y, x], {
      icon: L.divIcon({
        className: '',
        html: '<div style="position:relative"><div class="user-range"></div><div class="user-pulse"></div><div class="user-core"></div></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      }),
      zIndexOffset: 1000
    }).addTo(map);
  } else {
    playerMarker.setLatLng([y, x]);
  }
};

window.updateQuests = function(quests) {
  window.lastQuests = quests; // Save for calibration updates
  
  questMarkers.forEach(m => map.removeLayer(m));
  questMarkers = [];
  
  if (quests) {
    quests.forEach(q => {
      const [y, x] = gpsToPixel(q.lat, q.lng);
      
      const sc = q.status === 'active' ? 'active' : q.canInteract ? 'available' : 'locked';
      const dt = q.distance ? (q.distance < 1000 ? q.distance + 'm' : (q.distance / 1000).toFixed(1) + 'km') : '';
      const h = '<div class="quest-container ' + (sc === 'locked' ? ' disabled' : '') + '"><div class="quest-pill ' + sc + '"><div class="quest-icon" style="background:' + q.color + '20;color:' + q.color + '">⚔</div><div><div class="quest-title">' + q.title + '</div><div class="quest-distance">' + dt + '</div></div><div class="quest-reward">' + q.reward + '</div></div><div class="quest-point" style="border-color:' + q.color + '"></div></div>';
      
      const m = L.marker([y, x], {
        icon: L.divIcon({
          className: '',
          html: h,
          iconSize: [140, 60],
          iconAnchor: [70, 57]  // Anchor at the quest-point dot (bottom center)
        })
      }).addTo(map);
      
      m.on('click', () => sendMsg({ type: 'QUEST_TAP', quest: q }));
      questMarkers.push(m);
    });
  }
};

window.addEventListener('message', e => {
  if (e.data.type === 'UPDATE_PLAYER') window.updatePlayer(e.data.player);
  else if (e.data.type === 'UPDATE_QUESTS') window.updateQuests(e.data.quests);
  else if (e.data.type === 'CENTER_MAP') {
    const [y, x] = gpsToPixel(e.data.lat, e.data.lng);
    map.setView([y, x], 5);
  }
});

// Debug tile loading
let loadOK = 0;
map.on('tileload', function(e) {
  loadOK++;
});
map.on('load', function() {
  debugLog('Loaded ' + loadOK + ' tiles');
});
map.on('tileerror', function(e) {
  const parts = e.tile?.src?.split('/') || [];
  debugLog('ERR: ' + parts.slice(-3).join('/'));
});

debugLog('z=' + map.getZoom() + ' bounds=' + MAP_WIDTH + 'x' + MAP_HEIGHT);
setTimeout(() => sendMsg({ type: 'MAP_READY' }), 300);
<\/script></body></html>`;

// Erstelle final HTML mit korrekter Tile-URL
const getFinalHtml = () => {
  const tileUrl = Platform.OS === 'web' 
    ? window.location.origin + '/tiles'
    : 'https://quest-app-tiles.pages.dev'; // Fallback oder dein Server
  return MAP_HTML.replace(/TILE_BASE_URL/g, tileUrl);
};

const MapScreen = () => {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const locationWatchId = useRef(null);
  
  const { updateLocation, quests: allQuests, locations: allLocations } = useGame();
  const { activeQuests, startQuest } = useQuests();
  
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLoc, setUserLoc] = useState(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState('searching');
  const [availableQuests, setAvailableQuests] = useState([]);
  const mapReadyRef = useRef(false);
  const hasInitiallyCenteredRef = useRef(false);

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

  // Request location - can be called manually for retry (works on both web and native)
  const requestLocation = useCallback(async () => {
    setLocationStatus('searching');
    
    if (Platform.OS === 'web') {
      // Web: Use navigator.geolocation
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
          console.log('Geolocation retry error:', err.code, err.message);
          setLocationStatus(err.code === 1 ? 'denied' : 'error');
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
      );
    } else {
      // Native: Use expo-location
      try {
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
        } else {
          setLocationStatus('denied');
        }
      } catch (e) {
        console.log('Location error:', e);
        setLocationStatus('error');
      }
    }
  }, [updateLocation, generateNearbyQuests]);

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

  // Center on user location when map is ready and real location is found
  useEffect(() => {
    if (!mapReady || hasInitiallyCenteredRef.current) return;
    if (locationStatus !== 'found') return;
    
    // Only center if we have a real location (not default)
    const isDefaultLoc = userLoc.latitude === DEFAULT_LOCATION.latitude && 
                         userLoc.longitude === DEFAULT_LOCATION.longitude;
    if (isDefaultLoc) return;
    
    hasInitiallyCenteredRef.current = true;
    
    // Center map on user's actual location
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe[title="Quest Map"]');
      iframe?.contentWindow?.postMessage({ type: 'CENTER_MAP', lat: userLoc.latitude, lng: userLoc.longitude }, '*');
    } else {
      webviewRef.current?.injectJavaScript(`window.map?.setView([${userLoc.latitude}, ${userLoc.longitude}], 17);true;`);
    }
  }, [mapReady, locationStatus, userLoc]);

  // Calculate positions based on safe area and navbar
  const topOffset = Platform.OS === 'ios' ? insets.top + 10 : 16;
  // Navbar actual height from AppNavigator
  const bottomBarBottom = Platform.OS === 'ios' ? insets.bottom + 60 : 12;

  return (
    <View style={styles.container}>
      {/* Map - Full Screen */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <iframe 
            srcDoc={getFinalHtml()} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            title="Quest Map" 
          />
        ) : (
          <WebView 
            ref={webviewRef}
            source={{ html: getFinalHtml() }} 
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
        )}
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

      {/* Quest Detail Sheet */}
      <Animated.View style={[styles.bottomSheet, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 70 : 20, transform: [{ translateY: slideAnim }] }]}>
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
