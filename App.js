import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
// CRITICAL: This handler dictates how the OS treats notifications when the app is in the background.
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
  const { isSignedIn, isLoaded } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  // ─── CLOUD REHYDRATION INTERCEPTOR ───
  useEffect(() => {
    if (isLoaded && isSignedIn && user && !hasCompletedSetup) {
      // Check if the user has data stored in Clerk from a previous installation
      if (user.unsafeMetadata && user.unsafeMetadata.hasCompletedSetup) {
        console.log("[App] Cloud profile found. Rehydrating local device...");
        // Execute the store action to bypass onboarding
        if (syncProfileFromCloud) {
          syncProfileFromCloud(user.unsafeMetadata);
        } else {
          console.warn("[App] syncProfileFromCloud action is missing in useHealthStore.");
        }
      }
    }
  }, [isLoaded, isSignedIn, user, hasCompletedSetup, syncProfileFromCloud]);
  // ─── NOTIFICATION SCHEDULER ───
  useEffect(() => {
    const setupNotifications = async () => {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.warn('[App] Notification permissions denied by user.');
        return;
      }
      // Reverted to production state: Read actual user preferences instead of forced override
      const { isWaterReminderEnabled, isMorningCheckInEnabled } = useHealthStore.getState();
      await restoreNotifications(isMorningCheckInEnabled, isWaterReminderEnabled); 
      console.log('[App] Background notifications scheduled securely.');
    };
    setupNotifications();
  }, []);
  // ─── SPLASH SCREEN MANAGER ───
  useEffect(() => {
    if (fontsLoaded && _hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, _hasHydrated]);
  if (!_hasHydrated || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#5BB5EB" />
      </View>
    );
  }
  const isAuthenticated = isGuestMode || isSignedIn;
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