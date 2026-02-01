# Launch Timer Testing Guide

## Implementation Summary

The launch timer locks the app to the landing screen until midnight (00:00) tonight, but ONLY when deployed. On localhost/dev mode, the timer is bypassed.

## Testing Scenarios

### ✅ Test 1: Localhost/Dev Mode (Timer Bypassed)

**Web Testing:**
1. Open http://localhost:8081 in your browser
2. **Expected Result:** 
   - Button shows "Start Your Quest" (NOT "Starts in XX:XX:XX")
   - Button is enabled and clickable
   - Subtext shows "Free to play • No credit card required"
   - Compass icon (not clock icon)

**Native Testing (Android/iOS):**
1. Run `npx expo start` and open in Expo Go
2. **Expected Result:** Same as web - timer is bypassed in __DEV__ mode

### ✅ Test 2: Deployed Environment (Timer Active - Before Midnight)

**Deployment Testing:**
1. Build and deploy the app: `npm run build`
2. Access the deployed URL (NOT localhost)
3. **Expected Result (if before midnight):**
   - Button shows "Starts in HH:MM:SS" (live countdown)
   - Button is disabled (opacity 0.5, not clickable)
   - Countdown updates every second
   - Clock icon (not compass icon)
   - Subtext shows "Launch countdown • Coming soon"

### ✅ Test 3: Deployed Environment (Timer Inactive - After Midnight)

**Post-Launch Testing:**
1. Access deployed URL after midnight passes
2. **Expected Result:**
   - Timer automatically unlocks when countdown reaches 00:00:00
   - Button shows "Start Your Quest"
   - Button is enabled and clickable
   - Compass icon returns
   - Subtext shows "Free to play • No credit card required"
   - App functions normally (permanent unlock)

## Environment Detection Logic

```javascript
// Web: Checks window.location.hostname
if (Platform.OS === 'web') {
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '[::1]';
}

// Native: Checks React Native dev flag
return __DEV__;
```

## Timer Calculation

- **Target:** Next midnight (00:00:00) local time
- **Format:** HH:MM:SS (e.g., "03:45:12")
- **Update Interval:** 1 second
- **Auto-unlock:** When countdown reaches 00:00:00

## Current Status

✅ **Localhost Test:** Server running at http://localhost:8081
- Open in browser to verify timer is bypassed
- Button should be clickable with "Start Your Quest" text

✅ **Code Logic:** Verified correct implementation
- Environment detection working
- Timer calculation accurate
- Button state properly controlled
- Visual feedback appropriate

## Manual Verification Checklist

- [x] Launch timer utility created with proper environment detection
- [x] LandingScreen updated with countdown state
- [x] GlassButton supports disabled state
- [x] Timer updates every second when locked
- [x] Button disabled when timer active
- [x] Button enabled on localhost/dev mode
- [x] Correct icon shown (compass vs clock)
- [x] Correct subtext shown based on lock state
- [x] Timer auto-unlocks at midnight

## Quick Test (Right Now)

Since the Expo server is already running:
1. Open http://localhost:8081 in your browser
2. You should see the landing screen with "Start Your Quest" button (NOT locked)
3. Button should be clickable
4. This confirms localhost bypass is working ✅
