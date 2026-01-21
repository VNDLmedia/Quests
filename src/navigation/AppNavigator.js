import React, { Suspense, lazy } from 'react';
import { Platform, StyleSheet, View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

// Lazy load screens
const MapScreen = lazy(() => import('../screens/VibeMapScreen'));
const AdventuresScreen = lazy(() => import('../screens/QuestLogScreen'));
const SocialScreen = lazy(() => import('../screens/SocialScreen'));
const UserScreen = lazy(() => import('../screens/UserScreen'));

// Loading fallback
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

// Wrap screen with Suspense
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const Tab = createBottomTabNavigator();

// Check if running as PWA
const isPWA = Platform.OS === 'web' && window.matchMedia?.('(display-mode: standalone)').matches;

const AppNavigator = () => {
  const insets = useSafeAreaInsets();
  
  // Calculate tab bar height - more padding for PWA on Android
  const tabBarHeight = Platform.select({
    ios: 50 + insets.bottom,
    android: isPWA ? 60 : 56,
    web: isPWA ? 60 : 56,
    default: 56,
  });

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={Platform.OS === 'android'}
      />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: [
              styles.tabBar,
              { 
                height: tabBarHeight,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
              }
            ],
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.text.muted,
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIconStyle: styles.tabIcon,
            tabBarIcon: ({ focused, color }) => {
              let iconName;
              if (route.name === 'Map') iconName = focused ? 'compass' : 'compass-outline';
              else if (route.name === 'Quests') iconName = focused ? 'layers' : 'layers-outline';
              else if (route.name === 'Social') iconName = focused ? 'people' : 'people-outline';
              else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
              
              return <Ionicons name={iconName} size={22} color={color} />;
            },
          })}
        >
          <Tab.Screen 
            name="Map" 
            component={withSuspense(MapScreen)} 
            options={{ tabBarLabel: 'Karte' }}
          />
          <Tab.Screen 
            name="Quests" 
            component={withSuspense(AdventuresScreen)} 
            options={{ tabBarLabel: 'Quests' }}
          />
          <Tab.Screen 
            name="Social" 
            component={withSuspense(SocialScreen)} 
            options={{ tabBarLabel: 'Social' }}
          />
          <Tab.Screen 
            name="Profil" 
            component={withSuspense(UserScreen)} 
            options={{ tabBarLabel: 'Profil' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  tabIcon: {
    marginTop: 4,
  },
});

export default AppNavigator;
