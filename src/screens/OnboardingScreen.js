import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';

import { useTheme } from '../theme/theme';

const slides = [
  {
    key: 'track',
    badge: 'Precision Tracking',
    title: 'Track every health metric in one place',
    text: 'Log sleep, steps, water, weight, and daily habits with a clean dashboard built for consistency.',
    image: require('../../assets/Onboarding Screen/Precision_Tracking..png'),
    feature: 'Daily progress overview',
  },
  {
    key: 'ai',
    badge: 'AI Assistant',
    title: 'Get AI-powered guidance tailored to you',
    text: 'Receive smart insights, health summaries, and next-step suggestions based on your routines and goals.',
    image: require('../../assets/Onboarding Screen/Health.png'),
    feature: 'AI health insights',
  },
  {
    key: 'goals',
    badge: 'Sleep & Recovery',
    title: 'Build better habits with guided sleep tracking',
    text: 'Stay consistent with reminders, sleep goals, and recovery tracking that helps you feel better every day.',
    image: require('../../assets/Onboarding Screen/Sleep.png'),
    feature: 'Better sleep routines',
  },
];

function SliderButton({ label, variant = 'primary', COLORS, FONTS }) {
  const isGhost = variant === 'ghost';

  return (
    <View
      style={[
        styles.button,
        {
          backgroundColor: isGhost ? COLORS.card : COLORS.primary,
          borderColor: isGhost ? COLORS.border : COLORS.primary,
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          FONTS.buttonText,
          { color: isGhost ? COLORS.textSecondary : COLORS.onPrimary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: COLORS.background }]}> 
      <View style={styles.backgroundGlow}>
        <View
          style={[
            styles.glowCircle,
            {
              backgroundColor: isDark ? 'rgba(47,191,155,0.14)' : 'rgba(18,110,86,0.10)',
              top: 48,
              right: -72,
            },
          ]}
        />
        <View
          style={[
            styles.glowCircle,
            {
              backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(14,165,233,0.10)',
              bottom: 20,
              left: -60,
            },
          ]}
        />
      </View>

      <View style={[styles.heroCard, { backgroundColor: 'transparent', borderColor: COLORS.border }]}> 
        <View style={styles.heroTopRow}>
          <View style={[styles.badge, { backgroundColor: COLORS.primaryContainer }]}> 
            <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} />
            <Text style={[styles.badgeText, { color: COLORS.primary }]}>{item.badge}</Text>
          </View>
          <View style={[styles.aiPill, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}> 
            <Ionicons name="analytics-outline" size={14} color={COLORS.textSecondary} />
            <Text style={[styles.aiPillText, { color: COLORS.textSecondary }]}>AI</Text>
          </View>
        </View>

        <LinearGradient
          colors={isDark ? ['#122331', '#0D1724'] : ['#EAF8F4', '#DDF3EE']}
          style={styles.imageFrame}
        >
          <View style={styles.imageAccent} />
          <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
        </LinearGradient>

        <View style={styles.textWrap}>
          <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.text, FONTS.bodyText, { color: COLORS.textSecondary }]}>{item.text}</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureChip, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}> 
            <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.success} />
            <Text style={[styles.featureText, { color: COLORS.textSecondary }]}>{item.feature}</Text>
          </View>
          <View style={[styles.featureChip, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}> 
            <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.primary} />
            <Text style={[styles.featureText, { color: COLORS.textSecondary }]}>Private & secure</Text>
          </View>
        </View>
      </View>

    </View>
  );

  return (
    <AppIntroSlider
      data={slides}
      renderItem={renderItem}
      bottomButton
      renderNextButton={() => <SliderButton label="Next" COLORS={COLORS} FONTS={FONTS} />}
      renderDoneButton={() => <SliderButton label="Get started" COLORS={COLORS} FONTS={FONTS} />}
      onDone={() => navigation.replace('LoginScreen')}
      activeDotStyle={{ backgroundColor: COLORS.primary, width: 10, borderRadius: 999 }}
      dotStyle={{ backgroundColor: COLORS.border }}
    />
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  glowCircle: {
    position: 'absolute',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aiPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  aiPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imageFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageAccent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    gap: 12,
  },
  iconWrap: {
    width: 170,
    height: 170,
    borderRadius: 85,
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'left',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    minHeight: 54,
    width: '100%',
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    outlineStyle: 'none',
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
});
