import { ClerkProvider, useAuth } from '@clerk/expo';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import SetupGoalsScreen from './src/screens/SetupGoalsScreen';
import { useHealthStore } from './src/store/useHealthStore';
import {
    requestNotificationPermissions,
} from './src/utils/notifications';
import { tokenCache } from './src/utils/tokenCache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function MainApp() {
  const isGuestMode = useHealthStore((state) => state.isGuestMode);
  const hasCompletedSetup = useHealthStore((state) => state.hasCompletedSetup);
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const _hasHydrated = useHealthStore((state) => state._hasHydrated);

  // Load Inter fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.log('[App] Notification permissions not granted');
        return;
      }
      console.log('[App] Notification permissions granted - boot notification scheduling disabled for MVP');
    };

    setupNotifications();
  }, []);

  // Hide splash screen only when fonts are loaded and store is hydrated
  useEffect(() => {
    if (fontsLoaded && _hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, _hasHydrated]);

  // If the store or fonts are still loading, show a spinner instead of the app
  if (!_hasHydrated || !fontsLoaded) {
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