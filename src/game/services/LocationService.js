// ═══════════════════════════════════════════════════════════════════════════
// PULSE - Location Service
// ═══════════════════════════════════════════════════════════════════════════
// Handles location tracking, geofencing, and proximity detection

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { EUROPARK_LOCATIONS, calculateDistance, isWithinLocation } from '../config/quests';

const LOCATION_TASK_NAME = 'PULSE_BACKGROUND_LOCATION';
const GEOFENCE_TASK_NAME = 'PULSE_GEOFENCE';

class LocationServiceClass {
  constructor() {
    this.listeners = new Set();
    this.currentLocation = null;
    this.isTracking = false;
    this.watchSubscription = null;
    this.proximityAlerts = new Map(); // locationId -> { alerted: boolean, distance: number }
    this.lastDistanceUpdate = Date.now();
    this.totalDistance = 0;
    this.previousLocation = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Request location permissions
   */
  async requestPermissions() {
    if (Platform.OS === 'web') {
      return { granted: false, canAskAgain: false };
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return { granted: false, canAskAgain: true };
    }

    // Request background permissions for geofencing
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return {
      granted: foregroundStatus === 'granted',
      backgroundGranted: backgroundStatus === 'granted',
    };
  }

  /**
   * Get current location once
   */
  async getCurrentLocation() {
    if (Platform.OS === 'web') {
      return this.getMockLocation();
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Mock location for web/testing
   */
  getMockLocation() {
    return {
      latitude: 47.8224,
      longitude: 13.0456,
      accuracy: 10,
      timestamp: Date.now(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start continuous location tracking
   */
  async startTracking(options = {}) {
    if (Platform.OS === 'web' || this.isTracking) {
      return;
    }

    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    this.isTracking = true;

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: options.distanceInterval || 10, // meters
        timeInterval: options.timeInterval || 5000, // ms
      },
      (location) => this.handleLocationUpdate(location)
    );
  }

  /**
   * Stop location tracking
   */
  stopTracking() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isTracking = false;
  }

  /**
   * Handle location update
   */
  handleLocationUpdate(location) {
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };

    // Calculate distance traveled
    if (this.previousLocation) {
      const distance = calculateDistance(
        this.previousLocation.latitude,
        this.previousLocation.longitude,
        coords.latitude,
        coords.longitude
      );
      
      // Only count if accuracy is good enough
      if (coords.accuracy < 30 && distance < 100) { // Ignore large jumps
        this.totalDistance += distance;
      }
    }

    this.previousLocation = coords;
    this.currentLocation = coords;

    // Check proximity to POIs
    this.checkProximity(coords);

    // Notify listeners
    this.notify('locationUpdate', coords);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GEOFENCING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Setup geofences for all Europark locations
   */
  async setupGeofences() {
    if (Platform.OS === 'web') return;

    const { backgroundGranted } = await this.requestPermissions();
    if (!backgroundGranted) return;

    const regions = Object.values(EUROPARK_LOCATIONS).map(loc => ({
      identifier: loc.id,
      latitude: loc.lat,
      longitude: loc.lng,
      radius: loc.radius,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

    try {
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    } catch (error) {
      console.error('Failed to setup geofences:', error);
    }
  }

  /**
   * Stop geofencing
   */
  async stopGeofences() {
    if (Platform.OS === 'web') return;

    try {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    } catch (error) {
      // Geofencing might not be running
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROXIMITY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check proximity to all POIs
   */
  checkProximity(coords) {
    const nearbyLocations = [];
    const PROXIMITY_THRESHOLD = 100; // meters for "nearby" alert
    const ARRIVAL_THRESHOLD = 30; // meters for "arrived" alert

    for (const [id, location] of Object.entries(EUROPARK_LOCATIONS)) {
      const distance = calculateDistance(
        coords.latitude,
        coords.longitude,
        location.lat,
        location.lng
      );

      const alert = this.proximityAlerts.get(id) || { 
        nearbyAlerted: false, 
        arrivedAlerted: false,
        distance: Infinity 
      };

      // Check for "nearby" alert
      if (distance <= PROXIMITY_THRESHOLD && !alert.nearbyAlerted) {
        this.notify('nearby', { location, distance });
        alert.nearbyAlerted = true;
      }

      // Check for "arrived" alert
      if (distance <= location.radius && !alert.arrivedAlerted) {
        this.notify('arrived', { location, distance });
        alert.arrivedAlerted = true;
        nearbyLocations.push({ ...location, distance });
      }

      // Reset alerts if moved away
      if (distance > PROXIMITY_THRESHOLD * 1.5) {
        alert.nearbyAlerted = false;
      }
      if (distance > location.radius * 2) {
        alert.arrivedAlerted = false;
      }

      alert.distance = distance;
      this.proximityAlerts.set(id, alert);
    }

    return nearbyLocations;
  }

  /**
   * Get distance to a specific location
   */
  getDistanceTo(locationId) {
    if (!this.currentLocation) return null;

    const location = EUROPARK_LOCATIONS[locationId];
    if (!location) return null;

    return calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      location.lat,
      location.lng
    );
  }

  /**
   * Check if currently at a location
   */
  isAtLocation(locationId) {
    if (!this.currentLocation) return false;
    return isWithinLocation(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      locationId
    );
  }

  /**
   * Get all nearby locations
   */
  getNearbyLocations(radius = 200) {
    if (!this.currentLocation) return [];

    return Object.entries(EUROPARK_LOCATIONS)
      .map(([id, loc]) => ({
        ...loc,
        id,
        distance: calculateDistance(
          this.currentLocation.latitude,
          this.currentLocation.longitude,
          loc.lat,
          loc.lng
        ),
      }))
      .filter(loc => loc.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISTANCE TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get total distance walked in this session
   */
  getTotalDistance() {
    return this.totalDistance;
  }

  /**
   * Reset distance counter
   */
  resetDistance() {
    this.totalDistance = 0;
    this.previousLocation = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTENER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────

  cleanup() {
    this.stopTracking();
    this.stopGeofences();
    this.listeners.clear();
    this.proximityAlerts.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// BACKGROUND TASK DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

// Define geofence task
TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data;
    
    // eventType: Location.GeofencingEventType.Enter or Exit
    // region: { identifier, latitude, longitude, radius }
    
    console.log(`Geofence ${eventType}: ${region.identifier}`);
    
    // In a real app, you'd communicate with the app via AsyncStorage or other means
  }
});

// Singleton instance
export const LocationService = new LocationServiceClass();
export default LocationService;

