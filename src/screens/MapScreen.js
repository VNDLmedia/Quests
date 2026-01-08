import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import { GlassCard } from '../components';

// Dynamischer Import für Native-only Module, um Web-Abstürze zu verhindern
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.warn('Maps could not be loaded', e);
  }
}

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [quests, setQuests] = useState([]);

  useEffect(() => {
    (async () => {
      // Standort-Logik nur auf Mobile
      if (Platform.OS === 'web') return;

      const Location = require('expo-location');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      spawnQuests(location.coords);
    })();
  }, []);

  const spawnQuests = (coords) => {
    const newQuests = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      title: `Quest ${i + 1}`,
      coordinate: {
        latitude: coords.latitude + (Math.random() - 0.5) * 0.01,
        longitude: coords.longitude + (Math.random() - 0.5) * 0.01,
      },
    }));
    setQuests(newQuests);
  };

  // Web-spezifische Ansicht
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webPlaceholder}>
          <Text style={styles.title}>Quest Map (Web Vorschau)</Text>
          <Text style={styles.subtitle}>
            Die interaktive RPG-Karte ist für mobile Geräte optimiert. 
            Bitte nutze die Expo Go App auf deinem Smartphone.
          </Text>
          <View style={styles.miniMap}>
            <View style={[styles.dot, { top: '40%', left: '30%' }]} />
            <View style={[styles.dot, { top: '60%', left: '70%' }]} />
            <View style={[styles.playerDot, { top: '50%', left: '50%' }]} />
          </View>
        </View>

        <View style={styles.overlay}>
          <GlassCard style={styles.statusCard}>
            <Text style={styles.statusText}>Level 5 Adventurer</Text>
            <Text style={styles.xpText}>XP: 1250 / 2000</Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  // Mobile Ansicht
  return (
    <View style={styles.container}>
      {location && MapView ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          customMapStyle={darkMapStyle}
        >
          {quests.map((quest) => (
            <Marker
              key={quest.id}
              coordinate={quest.coordinate}
              title={quest.title}
              pinColor="#38bdf8"
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{errorMsg || 'Locating adventurer...'}</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <GlassCard style={styles.statusCard}>
          <Text style={styles.statusText}>Level 5 Adventurer</Text>
          <Text style={styles.xpText}>XP: 1250 / 2000</Text>
        </GlassCard>
      </View>
    </View>
  );
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '500',
  },
  webPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  miniMap: {
    width: 200,
    height: 200,
    backgroundColor: '#1e293b',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#38bdf8',
    position: 'relative',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#38bdf8',
    borderRadius: 5,
  },
  playerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  overlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  statusCard: {
    padding: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
});

export default MapScreen;
