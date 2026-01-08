# Quests - React Native App

Ein sauber aufgesetztes React Native Projekt mit Expo.

## Projektstruktur

```
├── src/
│   ├── components/      # Wiederverwendbare UI-Komponenten
│   ├── screens/         # App-Bildschirme
│   ├── navigation/      # Navigation-Konfiguration
│   ├── utils/           # Hilfsfunktionen
│   ├── constants/       # App-Konstanten (Farben, Größen, etc.)
│   └── config/          # App-Konfiguration
├── assets/              # Bilder und andere Assets
├── App.js               # Haupt-App-Komponente
└── package.json
```

## Installation

Die Abhängigkeiten sind bereits installiert. Falls nötig:

```bash
npm install
```

## Entwicklung

Starte den Expo Development Server:

```bash
npm start
```

Dann kannst du die App auf verschiedenen Plattformen starten:

- **Android**: `npm run android` oder drücke `a` im Expo Terminal
- **iOS**: `npm run ios` oder drücke `i` im Expo Terminal (nur auf macOS)
- **Web**: `npm run web` oder drücke `w` im Expo Terminal

**Alternative**: Scanne den QR-Code mit der Expo Go App auf deinem Smartphone!

## Verwendete Technologien

- **React Native** - Framework für native Apps
- **Expo** - Entwicklungstool und Plattform
- **React Navigation** - Navigation-Lösung

## Nächste Schritte

1. Weitere Screens in `src/screens/` hinzufügen
2. Navigation in `src/navigation/AppNavigator.js` erweitern
3. Komponenten in `src/components/` erstellen
4. API-Integration in `src/config/index.js` konfigurieren

