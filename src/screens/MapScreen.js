import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import { GlassCard } from '../components';
import { COLORS, PALETTE } from '../theme';

// Dynamic import for native-only modules
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

  // Web view
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webPlaceholder}>
          <Text style={styles.title}>Quest Map (Web Preview)</Text>
          <Text style={styles.subtitle}>
            The interactive RPG map is optimized for mobile devices. 
            Please use the Expo Go app on your smartphone.
          </Text>
          <View style={styles.miniMap}>
            <View style={[styles.dot, { top: '40%', left: '30%' }]} />
            <View style={[styles.dot, { top: '60%', left: '70%' }]} />
            <View style={[styles.playerDot, { top: '50%', left: '50%' }]} />
          </View>
        </View>

        <View style={styles.overlay}>
          <GlassCard style={styles.statusCard} variant="dark">
            <Text style={styles.statusText}>Level 5 Pathfinder</Text>
            <Text style={styles.xpText}>XP: 1250 / 2000</Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  // Mobile view
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
              pinColor={COLORS.primary}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{errorMsg || 'Locating adventurer...'}</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <GlassCard style={styles.statusCard} variant="dark">
          <Text style={styles.statusText}>Level 5 Pathfinder</Text>
          <Text style={styles.xpText}>XP: 1250 / 2000</Text>
        </GlassCard>
      </View>
    </View>
  );
};

// Dark map style matching Eternal Path theme
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": PALETTE.navy.dark }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.text.muted }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": PALETTE.navy.darkest }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.gold.muted }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.gold.muted }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1a2d3d" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#4a6b5a" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": PALETTE.navy.light }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": PALETTE.navy.darkest }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.text.secondary }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": PALETTE.navy.muted }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": PALETTE.navy.darkest }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.gold.warm }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": PALETTE.navy.medium }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.gold.muted }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a1628" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": PALETTE.text.muted }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": PALETTE.navy.darkest }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
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
    backgroundColor: COLORS.backgroundDark,
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  webPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  miniMap: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
  },
  playerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.background,
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
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginTop: 5,
  },
});

export default MapScreen;
