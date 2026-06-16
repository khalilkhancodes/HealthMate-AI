import { useSignInWithGoogle } from '@clerk/expo/google';
import { useAuth } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useState } from 'react';

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

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const { isSignedIn } = useAuth();
  const clearGuestMode = useHealthStore((state) => state.clearGuestMode);
  const setIsGuestMode = useHealthStore((state) => state.setIsGuestMode);
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();

  // ✅ When Clerk confirms sign-in, clear guest mode and close modal
  useEffect(() => {
    if (isSignedIn) {
      clearGuestMode();
      // Dismiss the modal — App.js will re-route to AppNavigator automatically
      if (navigation?.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [isSignedIn]);

  const handleGoogleSignIn = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await startGoogleAuthenticationFlow();

      if (!result) {
        // User cancelled or flow returned nothing
        setIsLoading(false);
        return;
      }

      const { createdSessionId, setActive } = result;

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // ✅ useEffect above will fire once isSignedIn becomes true
        return;
      }

      // Flow completed but no session (e.g. cancelled)
      setIsLoading(false);

    } catch (err) {
      setIsLoading(false);

      const isCancelled =
        err?.code === 'SIGN_IN_CANCELLED' ||
        err?.code === '-5' ||
        err?.message?.includes('cancelled');

      if (!isCancelled) {
        console.error('Google sign-in error:', err);
        Alert.alert(
          'Sign-In Failed',
          err?.message || 'Something went wrong. Please try again.'
        );
      }
    }
  }, [startGoogleAuthenticationFlow, isLoading]);

  const handleContinueAsGuest = useCallback(() => {
    setIsGuestMode(true);
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  }, [setIsGuestMode, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.content}>

        {/* Close button (since it's a modal) */}
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
          onPress={handleGoogleSignIn}
          disabled={isLoading}
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
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