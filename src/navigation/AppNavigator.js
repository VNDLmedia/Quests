import React, { Suspense, lazy } from 'react';
import { Platform, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

// Lazy load screens to avoid circular dependencies
const MapScreen = lazy(() => import('../screens/VibeMapScreen'));
const AdventuresScreen = lazy(() => import('../screens/QuestLogScreen'));
const SocialScreen = lazy(() => import('../screens/SocialScreen'));
const UserScreen = lazy(() => import('../screens/UserScreen'));

// Loading fallback
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
    <ActivityIndicator size="large" color="#4F46E5" />
  </View>
);

// Wrap screen with Suspense
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.text.muted,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color }) => {
            let iconName;
            if (route.name === 'Map') iconName = focused ? 'compass' : 'compass-outline';
            else if (route.name === 'Quests') iconName = focused ? 'layers' : 'layers-outline';
            else if (route.name === 'Social') iconName = focused ? 'people' : 'people-outline';
            else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
            
            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={24} color={color} />
                {focused && <View style={styles.activeDot} />}
              </View>
            );
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
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  activeDot: {
    width: 4, 
    height: 4, 
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  }
});

export default AppNavigator;
