// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Location Service
// ═══════════════════════════════════════════════════════════════════════════
// Handles location tracking, geofencing, and proximity detection

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EUROPARK_LOCATIONS, calculateDistance, isWithinLocation } from '../config/quests';

const LOCATION_TASK_NAME = 'ETHERNAL_BACKGROUND_LOCATION';
const GEOFENCE_TASK_NAME = 'ETHERNAL_GEOFENCE';
const LAST_LOCATION_KEY = '@eternal_path_last_location';

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
    this._lastSaveTime = null; // Throttle location saves
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Request location permissions
   */
  async requestPermissions() {
    // Web permissions are handled by the browser when calling getCurrentPosition
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
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
    // Try to get real location first, even on web
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied, using mock location');
        return Platform.OS === 'web' ? this.getMockLocation() : null;
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
      console.warn('Error getting location, falling back to mock if web:', error);
      if (Platform.OS === 'web') {
        return this.getMockLocation();
      }
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
  // POSITION PERSISTENCE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Save last known location to AsyncStorage
   */
  async saveLastKnownLocation(coords) {
    try {
      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: coords.timestamp || Date.now(),
      };
      await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(locationData));
      console.log('[LocationService] Saved last location:', locationData.latitude, locationData.longitude);
    } catch (error) {
      console.warn('[LocationService] Failed to save last location:', error);
    }
  }

  /**
   * Load last known location from AsyncStorage
   * @returns {Object|null} Last known location or null
   */
  async getLastKnownLocation() {
    try {
      const stored = await AsyncStorage.getItem(LAST_LOCATION_KEY);
      if (stored) {
        const locationData = JSON.parse(stored);
        console.log('[LocationService] Loaded last location:', locationData.latitude, locationData.longitude);
        
        // Update current location if we don't have one yet
        if (!this.currentLocation) {
          this.currentLocation = {
            ...locationData,
            accuracy: 100, // Lower accuracy for stored location
          };
        }
        
        return locationData;
      }
    } catch (error) {
      console.warn('[LocationService] Failed to load last location:', error);
    }
    return null;
  }

  /**
   * Initialize with last known location, then try to get current
   * @returns {Object} Best available location (stored or current)
   */
  async initializeLocation() {
    // First, try to load last known location for quick startup
    const lastLocation = await this.getLastKnownLocation();
    
    // Then try to get current location
    const currentLocation = await this.getCurrentLocation();
    
    // If we got current location, save it
    if (currentLocation) {
      await this.saveLastKnownLocation(currentLocation);
      return currentLocation;
    }
    
    // Fall back to last known or mock
    return lastLocation || this.getMockLocation();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start continuous location tracking
   */
  async startTracking(options = {}) {
    if (this.isTracking) {
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
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
    } catch (error) {
      console.warn('Failed to start tracking:', error);
      this.isTracking = false;
    }
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

    // Save to AsyncStorage (throttled - only every 30 seconds)
    const now = Date.now();
    if (!this._lastSaveTime || now - this._lastSaveTime > 30000) {
      this._lastSaveTime = now;
      this.saveLastKnownLocation(coords);
    }

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

