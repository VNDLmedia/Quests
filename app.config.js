module.exports = {
  expo: {
    name: 'Ethernal Paths',
    slug: 'ethernal-paths',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4F46E5'
    },
    ios: {
      supportsTablet: true,
      statusBarStyle: 'dark-content',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4F46E5'
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
      themeColor: '#4F46E5',
      backgroundColor: '#F8FAFC',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      startUrl: '/',
      // Status bar configuration for PWA
      statusBar: {
        hidden: false,
        backgroundColor: '#4F46E5',
      },
    },
    // Plugins
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Erlaubt Ethernal Paths auf deine Kamera zuzugreifen um QR-Codes zu scannen.'
        }
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Erlaubt Ethernal Paths deinen Standort zu verwenden um Quests in deiner Nähe anzuzeigen.'
        }
      ]
    ],
  },
};
