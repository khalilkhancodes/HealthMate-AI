import { useAuth } from '@clerk/expo';
import { useSignInWithGoogle } from '@clerk/expo/google';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';

const COLORS = {
  background: '#fdfdfb',
  surface: '#ffffff',
  primary: '#447055',
  onPrimary: '#ffffff',
  textPrimary: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  waterbg: '#eef4ff',
};

const webClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID;

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const { startGoogleAuthenticationFlow } = useSignInWithGoogle({
    webClientId,
  });

  useEffect(() => {
    if (__DEV__ && !webClientId) {
      console.error(
        '[LoginScreen] webClientId is undefined. Check EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID ' +
        'in .env and app.config.js extra.'
      );
    }
  }, []);

  const clearGuestMode = useHealthStore((state) => state.clearGuestMode);
  const setIsGuestMode = useHealthStore((state) => state.setIsGuestMode);

  useEffect(() => {
    if (isSignedIn) {
      clearGuestMode();
      if (navigation?.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [isSignedIn, navigation, clearGuestMode]);

  const handleNativeGoogleSignIn = useCallback(async () => {
    if (isLoading || !isLoaded) return;

    if (!webClientId) {
      Alert.alert(
        'Configuration Error',
        'Google Sign-In is not configured correctly. Please contact support.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await startGoogleAuthenticationFlow();

      const createdSessionId = result?.createdSessionId;
      const setActive = result?.setActive;

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else if (__DEV__) {
        console.warn('[LoginScreen] Google auth returned no session:', result);
      }
    } catch (err) {
      const cancelCodes = ['SIGN_IN_CANCELLED', '-5', 'CANCELED', '12501'];
      const isCancelled =
        cancelCodes.includes(err?.code) ||
        cancelCodes.includes(String(err?.code));

      if (!isCancelled) {
        console.error('[LoginScreen] Google Sign-In failed:', err);
        Alert.alert(
          'Sign-In Failed',
          err?.message || 'Could not authenticate with Google. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLoaded, startGoogleAuthenticationFlow]);

  const handleContinueAsGuest = useCallback(() => {
    setIsGuestMode(true);
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  }, [setIsGuestMode, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.content}>
        {navigation?.canGoBack() && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.brandWrap}>
          <View style={[styles.logoCircle, { backgroundColor: COLORS.waterbg }]}>
            <Ionicons name="heart" size={34} color={COLORS.primary} />
          </View>
          <Text style={[styles.welcome, { color: COLORS.textPrimary }]}>
            Welcome to HealthMate AI!
          </Text>
          <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
            Your personal AI health companion
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            { backgroundColor: isLoading ? '#6a9e80' : COLORS.primary },
          ]}
          activeOpacity={0.9}
          onPress={handleNativeGoogleSignIn}
          disabled={isLoading || !isLoaded}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.onPrimary} />
          ) : (
            <Ionicons name="logo-google" size={20} color={COLORS.onPrimary} />
          )}
          <Text style={[styles.googleButtonText, { color: COLORS.onPrimary }]}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
          <Text style={[styles.dividerText, { color: COLORS.textMuted }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
        </View>

        <TouchableOpacity
          style={[
            styles.guestButton,
            { borderColor: COLORS.border, backgroundColor: COLORS.surface },
          ]}
          activeOpacity={0.8}
          onPress={handleContinueAsGuest}
          disabled={isLoading}
        >
          <Text style={[styles.guestButtonText, { color: COLORS.textPrimary }]}>
            Continue as Guest
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: COLORS.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  brandWrap: { alignItems: 'center', marginBottom: 48 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcome: { fontSize: 32, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  googleButton: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, flexDirection: 'row', gap: 10, marginBottom: 24, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  googleButtonText: { fontSize: 18, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 14 },
  guestButton: { borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginBottom: 32 },
  guestButtonText: { fontSize: 18, fontWeight: '700' },
  footerText: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
});