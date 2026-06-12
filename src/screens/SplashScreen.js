import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/theme';

const CIRCLE_1_SIZE = 150;
const CIRCLE_2_SIZE = 140;
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.2;
const CYCLE_DURATION = 2100;
const STAGGER_DELAY = 400;
// colors will be sourced from theme at render time

function BreathingCircle({ size, borderColor, scale, opacity }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.breathingCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const { COLORS } = useTheme();

  const circle1Scale = useSharedValue(0);
  const circle2Scale = useSharedValue(0);
  const circle1Opacity = useSharedValue(1);
  const circle2Opacity = useSharedValue(1);

  useEffect(() => {
    void ExpoSplashScreen.hideAsync().catch(() => {});

    // Circle 1: 0.7 → 1.4 → 0.7 scale, 0.8 → 0.3 → 0.8 opacity
    circle1Scale.value = withRepeat(
      withSequence(
        withTiming(SCALE_MAX, {
          duration: CYCLE_DURATION / 1.9,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(SCALE_MIN, {
          duration: CYCLE_DURATION / 1.9,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    circle1Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: CYCLE_DURATION / 2.3, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: CYCLE_DURATION / 2.3, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Circle 2: Same animation but delayed by 0.4s
    circle2Scale.value = withDelay(
      STAGGER_DELAY,
      withRepeat(
        withSequence(
          withTiming(SCALE_MAX, {
            duration: CYCLE_DURATION / 1.8,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(SCALE_MIN, {
            duration: CYCLE_DURATION /1.8,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    circle2Opacity.value = withDelay(
      STAGGER_DELAY,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: CYCLE_DURATION / 1.5, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: CYCLE_DURATION / 1.5, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    const timer = setTimeout(() => {
      navigation.replace('OnboardingScreen');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, circle1Opacity, circle1Scale, circle2Opacity, circle2Scale]);


  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.centerWrap}>
        <View style={styles.animationLayer} pointerEvents="none">
          <BreathingCircle size={CIRCLE_1_SIZE} borderColor="#FFFFFF" scale={circle1Scale} opacity={circle1Opacity} />
          <BreathingCircle size={CIRCLE_2_SIZE} borderColor="#0d0c0b3f" scale={circle2Scale} opacity={circle2Opacity} />
        </View>

        <View style={[styles.logoCircle, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.primary : '#000000' }] }>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        <Text style={[styles.appName]}>HealthMate</Text>
        <Text style={[styles.subtitle]}>Your AI Health Companion</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#447055',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationLayer: {
    position: 'absolute',
    bottom: 172,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    borderWidth: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 75,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
    zIndex: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '400',
    color: "#ffffff",
  },
});
