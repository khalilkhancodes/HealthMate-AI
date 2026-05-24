import { useWarmUpBrowser } from '../utils/useWarmUpBrowser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSignInWithGoogle } from '@clerk/expo/google';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  useWarmUpBrowser(); // Pre-warm the browser for faster Google sign-in on Android
  const { COLORS, FONTS, isDark } = useTheme();
  const setIsGuestMode = useHealthStore((state) => state.setIsGuestMode);
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();

  const handleGoogleSignIn = useCallback(async () => {
    console.log('➡️ Native Google sign-in pressed');
    
    if (typeof startGoogleAuthenticationFlow !== 'function') {
      console.error('startGoogleAuthenticationFlow is missing');
      Alert.alert('Configuration Error', 'Google sign-in is not available.');
      return;
    }

    try {
      console.log('Calling native startGoogleAuthenticationFlow...');
      
      // The native Android flow does not use redirect URLs
      const { createdSessionId, setActive } = await startGoogleAuthenticationFlow();
      
      console.log('Session ID Returned:', createdSessionId);

      // If successful, Credential Manager returns the session ID directly
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return; 
      }

      console.warn('Native flow aborted or returned null session.');
    } catch (err) {
      const message = err?.code === 'SIGN_IN_CANCELLED' || err?.code === '-5'
        ? 'Google sign-in was cancelled.'
        : err?.message || 'An error occurred during native Google sign-in.';

      if (err?.code !== 'SIGN_IN_CANCELLED' && err?.code !== '-5') {
        console.error('❌ Google sign-in error:', err);
        Alert.alert('Google Sign-In Error', message);
      }
    }
  }, [startGoogleAuthenticationFlow]);

  // Handle Guest Mode
  const handleContinueAsGuest = useCallback(() => {
    setIsGuestMode(true);
    // Guest mode navigation is handled in App.js by checking isGuestMode state
  }, [setIsGuestMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.content}>
        {/* --- BRAND SECTION --- */}
        <View style={styles.brandWrap}>
          <View style={[styles.logoCircle, { backgroundColor: isDark ? COLORS.surface : COLORS.waterbg }]}>
            <Ionicons name="heart" size={34} color={COLORS.primary} />
          </View>
          <Text style={[styles.welcome, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Welcome to HealthMate AI!</Text>
          <Text style={[styles.subtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Your personal AI health companion</Text>
        </View>

        {/* --- GOOGLE OAUTH BUTTON --- */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.9}
          onPress={handleGoogleSignIn}
        >
          <Ionicons name="logo-google" size={20} color={COLORS.onPrimary} />
          <Text style={[styles.googleButtonText, FONTS.buttonText, { color: COLORS.onPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* --- DIVIDER --- */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
          <Text style={[styles.dividerText, FONTS.bodyText, { color: COLORS.textMuted }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
        </View>

        {/* --- GUEST MODE BUTTON --- */}
        <TouchableOpacity
          style={[styles.guestButton, { borderColor: COLORS.border, backgroundColor: COLORS.border }]}
          activeOpacity={0.8}
          onPress={handleContinueAsGuest}
        >
          <Text style={[styles.guestButtonText, FONTS.subheading, { color: COLORS.textPrimary }]}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* --- FOOTER TEXT --- */}
        <Text style={[styles.footerText, FONTS.smallText, { color: COLORS.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  googleButton: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
  },
  guestButton: {
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  guestButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});