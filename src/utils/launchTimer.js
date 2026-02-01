import { Platform } from 'react-native';

/**
 * Launch Timer Utility
 * Controls app launch timing - locks to landing screen until midnight on deployed environments
 * Bypasses timer on localhost/dev mode for development
 */

/**
 * Check if running on localhost/dev environment
 * @returns {boolean} True if localhost or dev mode
 */
export const isLocalhost = () => {
  if (Platform.OS === 'web') {
    // Check if running on localhost for web
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname === '[::1]';
    }
    return false;
  }
  
  // For native, check React Native __DEV__ flag
  return __DEV__;
};

/**
 * Get midnight tonight (00:00:00) as a Date object
 * @returns {Date} Midnight tonight
 */
const getMidnightTonight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight (00:00:00)
  return midnight;
};

/**
 * Check if launch time has been reached (midnight tonight)
 * @returns {boolean} True if current time is past midnight tonight
 */
export const isLaunchTimeReached = () => {
  const now = new Date();
  const midnight = getMidnightTonight();
  return now >= midnight;
};

/**
 * Get time remaining until launch (midnight tonight)
 * @returns {Object} Object with hours, minutes, seconds remaining
 */
export const getTimeUntilLaunch = () => {
  const now = new Date();
  const midnight = getMidnightTonight();
  const diff = midnight - now;
  
  // If launch time has passed, return zeros
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
};

/**
 * Format time object to HH:MM:SS string
 * @param {Object} timeObj Object with hours, minutes, seconds
 * @returns {string} Formatted time string (e.g., "03:45:12")
 */
export const formatTimeRemaining = (timeObj) => {
  if (!timeObj) return '00:00:00';
  
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(timeObj.hours)}:${pad(timeObj.minutes)}:${pad(timeObj.seconds)}`;
};

/**
 * Check if app should be locked (not localhost and launch time not reached)
 * @returns {boolean} True if app should be locked to landing screen
 */
export const shouldLockApp = () => {
  return !isLocalhost() && !isLaunchTimeReached();
};
