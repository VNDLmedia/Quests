module.exports = {
  expo: {
    name: 'Ethernal Paths',
    slug: 'ethernal-paths',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0D1B2A'
    },
    ios: {
      supportsTablet: true,
      statusBarStyle: 'light-content',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0D1B2A'
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      // PWA Configuration
      name: 'Ethernal Paths',
      shortName: 'Ethernal',
      description: 'Quest-based adventure game',
      lang: 'de',
      themeColor: '#0D1B2A',
      backgroundColor: '#0D1B2A',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      startUrl: '/',
      // Status bar configuration for PWA
      statusBar: {
        hidden: false,
        backgroundColor: '#0D1B2A',
      },
    },
    // Plugins
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allows Eternal Paths to access your camera to scan QR codes.'
        }
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allows Eternal Paths to use your location to display quests nearby.'
        }
      ]
    ],
  },
};
