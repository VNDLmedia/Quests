# Quest App Architecture

## Overview
A location-based quest/gamification app for Europa-Park, built with React Native (Expo) for web and mobile, using Supabase for backend services.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo |
| Web Runtime | react-native-web |
| Navigation | @react-navigation/bottom-tabs |
| Map | Leaflet.js (via WebView/iframe) |
| Backend | Supabase (Auth, Database, Realtime) |
| State Management | React Context + useReducer |

---

## Project Structure

```
/
├── App.js                    # Root component, auth guard
├── src/
│   ├── config/
│   │   └── supabase.js       # Supabase client
│   ├── game/
│   │   ├── GameProvider.js   # Global state, auth, data fetching
│   │   ├── GameContext.js    # Context definition
│   │   ├── hooks/
│   │   │   └── useQuests.js  # Quest management hook
│   │   └── config/
│   │       └── quests.js     # Quest utilities (distance calc, etc.)
│   ├── screens/
│   │   ├── VibeMapScreen.js  # Main map with custom tiles
│   │   ├── LoginScreen.js    # Authentication UI
│   │   ├── UserScreen.js     # Profile display
│   │   └── ...
│   ├── navigation/
│   │   └── AppNavigator.js   # Bottom tab navigator
│   └── components/           # Reusable UI components
├── public/
│   └── tiles/                # Europa-Park map tiles (z/x/y.png)
├── scripts/
│   └── scrape-europapark-tiles.js
└── Docs/                     # Documentation
```

---

## Data Flow

### Authentication
```
User Action → LoginScreen → Supabase Auth → onAuthStateChange → GameProvider → UI Update
```

### Quest Data
```
App Start → GameProvider.fetchQuestsAndLocations() → Supabase → State
User accepts → useQuests.startQuest() → Supabase INSERT → State Update
Progress → useQuests.updateProgress() → Supabase UPDATE → State Update
```

### Map Tiles
```
Leaflet requests tile → Custom TileLayer.getTileUrl() → /tiles/{z}/{x}/{y}.png → Display
```

---

## Database Schema

### profiles
```sql
id          UUID PRIMARY KEY  -- References auth.users
display_name TEXT
level       INTEGER DEFAULT 1
xp          INTEGER DEFAULT 0
created_at  TIMESTAMPTZ
```

### locations
```sql
id          TEXT PRIMARY KEY  -- e.g., "silver-star"
name        TEXT
latitude    DECIMAL
longitude   DECIMAL
radius      INTEGER           -- Interaction radius in meters
type        TEXT              -- "attraction", "restaurant", etc.
```

### quests
```sql
id          TEXT PRIMARY KEY
title       TEXT
description TEXT
type        TEXT              -- "visit", "ride", "scan", etc.
xp_reward   INTEGER
location_id TEXT REFERENCES locations(id)
target_value INTEGER DEFAULT 1
```

### user_quests
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES profiles(id)
quest_id    TEXT REFERENCES quests(id)
status      TEXT              -- "active", "completed"
progress    INTEGER DEFAULT 0
started_at  TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

---

## Map System

### Coordinate System
The map uses `L.CRS.Simple` (pixel-based coordinates) instead of geographic coordinates.

| Parameter | Value | Notes |
|-----------|-------|-------|
| MAP_WIDTH | 120 | Coordinate units |
| MAP_HEIGHT | 152 | Coordinate units |
| Tile size | 256px | Standard |
| Zoom range | 2-7 | 2=overview, 7=max detail |
| Native zoom | 5 | Default view level |

### GPS to Pixel Conversion
Real GPS coordinates are converted to map pixel coordinates using linear interpolation within defined bounds, plus calibration offsets:

```javascript
GPS_BOUNDS = { minLat: 48.2620, maxLat: 48.2740, minLng: 7.7140, maxLng: 7.7320 }
COORD_BOUNDS = { minX: 0, maxX: 120, minY: 0, maxY: 152 }

// Calibrated offsets (tested Jan 27, 2026)
offsetX = 25.2
offsetY = -142
```

### Calibration Panel
A debug overlay in the top-left corner allows adjusting X/Y offsets in real-time:
- Sliders for quick adjustment
- Number inputs for precise decimal values
- Values update the player marker position immediately

### Tile Layer
Custom `L.TileLayer.EuropaPark` that:
1. Receives Leaflet's tile coordinates (z, x, y)
2. Bounds-checks against available tiles
3. Returns direct URL to local tile file (no coordinate transformation)

---

## Key Design Decisions

### 1. Supabase as Single Source of Truth
All game data (quests, progress, XP) is stored in Supabase. No local persistence for game state - only auth tokens are stored locally.

**Rationale**: Prevents sync issues, enables cross-device play, simplifies state management.

### 2. Hardcoded Supabase Credentials
The Supabase URL and anon key are hardcoded in `supabase.js` instead of using environment variables.

**Rationale**: Expo web had persistent issues loading `.env` variables. The anon key is public by design (RLS provides security).

### 3. Custom Tile Layer (No Y-Flip)
Tiles are served with direct coordinate passthrough, no Y-axis transformation.

**Rationale**: After extensive debugging, direct passthrough was the only configuration that worked correctly. The scraped tiles are already in the correct orientation for Leaflet's coordinate system.

### 4. Blob URL for Map HTML
The Leaflet map HTML is loaded via a Blob URL instead of inline HTML or external file.

**Rationale**: Prevents re-initialization on React re-renders, improves stability.

### 5. Memoized Context Value
`GameContext.Provider` value is wrapped in `useMemo` to prevent unnecessary re-renders.

**Rationale**: Fixed map flickering caused by context updates triggering full tree re-renders.

---

## Environment Setup

### Required Services
1. Supabase project with Auth enabled
2. Database tables created (see `supabase/schema.sql`)
3. RLS policies configured

### Local Development
```bash
npm install
npx expo start --web
```

### Tile Generation
```bash
node scripts/scrape-europapark-tiles.js
```
Tiles are saved to `public/tiles/` and served statically by Expo.

---

## Debugging Tips

1. **Map not showing tiles**: Check browser Network tab for tile request URLs
2. **Auth issues**: Check Supabase dashboard for auth logs
3. **Quest not saving**: Verify RLS policies allow INSERT for authenticated users
4. **Map flickering**: Ensure screen components are defined outside navigator
