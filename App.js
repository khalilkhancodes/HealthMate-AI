import { ClerkProvider, useAuth } from '@clerk/expo';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import SetupGoalsScreen from './src/screens/SetupGoalsScreen';
import { useHealthStore } from './src/store/useHealthStore';
import {
    requestNotificationPermissions,
    scheduleMorningCheckIn,
    scheduleWaterReminders,
} from './src/utils/notifications';
import { tokenCache } from './src/utils/tokenCache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

function MainApp() {
  const isGuestMode = useHealthStore((state) => state.isGuestMode);
  const hasCompletedSetup = useHealthStore((state) => state.hasCompletedSetup);
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const _hasHydrated = useHealthStore((state) => state._hasHydrated);

  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        return;
      }

      await scheduleWaterReminders();
      await scheduleMorningCheckIn();
    };

    setupNotifications();
  }, []);

  // If the store is still loading, show a spinner instead of the app
  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5BB5EB" />
      </View>
    );
  }

  const isAuthenticated = isGuestMode || isSignedIn;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated && !hasCompletedSetup ? (
          <SetupGoalsScreen />
        ) : isGuestMode ? (
          <AppNavigator />
        ) : (
          isSignedIn ? <AppNavigator /> : <AuthNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ClerkProvider 
      tokenCache={tokenCache} 
      publishableKey={publishableKey}
      standardBrowser={false}
    >
      <MainApp />
    </ClerkProvider>
  );
}