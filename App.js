import { ClerkProvider, useAuth } from '@clerk/expo';
import { FirebaseService } from './src/utils/firebaseService';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingWizardScreen from './src/screens/OnboardingWizardScreen';
import { useHealthStore } from './src/store/useHealthStore';
import {
  requestNotificationPermissions,
  restoreNotifications,
} from './src/utils/notifications';
import { tokenCache } from './src/utils/tokenCache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function MainApp() {
  const isGuestMode = useHealthStore((state) => state.isGuestMode);
  const hasCompletedSetup = useHealthStore((state) => state.hasCompletedSetup);
  const syncProfileFromCloud = useHealthStore((state) => state.syncProfileFromCloud);
  const _hasHydrated = useHealthStore((state) => state._hasHydrated);

  const { isSignedIn, isLoaded, userId } = useAuth({ treatPendingAsSignedOut: false });

  // ─── STATE TO PREVENT ONBOARDING FLASH ───
  const [cloudCheckStatus, setCloudCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'done'

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // ─── FIREBASE BACKGROUND SYNC ───
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background' && isSignedIn && userId) {
        const state = useHealthStore.getState();
        await FirebaseService.backupUserProfile(userId, state);
      }
    });
    return () => subscription.remove();
  }, [isSignedIn, userId]);

  // ─── FIREBASE CLOUD REHYDRATION INTERCEPTOR ───
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setCloudCheckStatus('idle');
      return;
    }

    if (isSignedIn && userId && !hasCompletedSetup && cloudCheckStatus === 'idle') {
      const attemptRehydration = async () => {
        setCloudCheckStatus('checking');
        console.log("[App] Checking Firebase for existing profile...");

        try {
          const cloudData = await FirebaseService.fetchUserProfile(userId);
          if (cloudData && cloudData.hasCompletedSetup) {
            console.log("[App] Firebase profile found. Rehydrating local device...");
            if (syncProfileFromCloud) {
              syncProfileFromCloud(cloudData);
            }
          } else {
            console.log("[App] No Firebase profile found. Proceeding to Onboarding.");
          }
        } catch (error) {
          console.error("[App] Rehydration error:", error);
        } finally {
          setCloudCheckStatus('done');
        }
      };

      attemptRehydration();
    }
  }, [isLoaded, isSignedIn, userId, hasCompletedSetup, cloudCheckStatus, syncProfileFromCloud]);

  // ─── NOTIFICATION SCHEDULER ───
  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.warn('[App] Notification permissions denied by user.');
        return;
      }
      const { isWaterReminderEnabled, isMorningCheckInEnabled } = useHealthStore.getState();
      await restoreNotifications(isMorningCheckInEnabled, isWaterReminderEnabled);
    };
    setupNotifications();
  }, []);

  // ─── SPLASH SCREEN MANAGER ───
  useEffect(() => {
    if (fontsLoaded && _hasHydrated && cloudCheckStatus !== 'checking') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, _hasHydrated, cloudCheckStatus]);

  // Block rendering while fonts load, Zustand hydrates, or Firebase checks for an existing profile
  if (!_hasHydrated || !fontsLoaded || cloudCheckStatus === 'checking') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#5BB5EB" />
      </View>
    );
  }

  const isAuthenticated = isSignedIn || isGuestMode;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {!isAuthenticated ? (
          <AuthNavigator />
        ) : !hasCompletedSetup ? (
          <OnboardingWizardScreen />
        ) : (
          <AppNavigator />
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