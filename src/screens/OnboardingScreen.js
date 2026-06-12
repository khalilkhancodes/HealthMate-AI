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
    // text: 'Log sleep, steps, water, weight, and daily habits with a clean dashboard built for consistency.',
    image: require('../../assets/OnboardingScreen/stepCounter.png'),
    feature: 'Daily progress overview',
  },
  {
    key: 'ai',
    badge: 'AI Assistant',
    title: 'Get AI-powered guidance tailored to you',
    // text: 'Receive smart insights, health summaries, and next-step suggestions based on your routines and goals.',
    image: require('../../assets/OnboardingScreen/waterIntake.png'),
    feature: 'AI health insights',
  },
  {
    key: 'goals',
    badge: 'Sleep & Recovery',
    title: 'Build better habits with guided sleep tracking',
    // text: 'Stay consistent with reminders, sleep goals, and recovery tracking that helps you feel better every day.',
    image: require('../../assets/OnboardingScreen/sleepTracker.png'),
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
          backgroundColor: isGhost ? COLORS.card : "#447055",
          borderColor: isGhost ? COLORS.border : "#447055",
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          FONTS.buttonText,
          { color: isGhost ? "#ffffff" : "#ffffff" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { COLORS, FONTS } = useTheme();

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: "#fdfdfb" }]}> 
      <View style={styles.heroCard}>
        {/* <View style={styles.heroTopRow}>
          <View style={[styles.badge, { backgroundColor: "#000000" }]}> 
            <Ionicons name="sparkles-outline" size={14} color={COLORS.primary} />
            <Text style={[styles.badgeText, { color: COLORS.primary }]}>{item.badge}</Text>
          </View>
          <View style={[styles.aiPill, { backgroundColor: "#000000", borderColor: "#e0e0e0" }]}> 
            <Ionicons name="analytics-outline" size={14} color="#ffffff" />
            <Text style={[styles.aiPillText, { color: "#ffffff" }]}>AI</Text>
          </View>
        </View> */}

        <LinearGradient
          colors={['#EAF8F4', '#DDF3EE']}
          style={styles.imageFrame}
        >
          <View style={styles.imageAccent} />
          <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
        </LinearGradient>

        <View style={styles.textWrap}>
          <Text style={[styles.title, FONTS.subtitle, { color: "#111810" }]}>{item.title}</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureChip, { borderColor: "#5f5c5cff" }]}> 
            <Ionicons name="checkmark-circle-outline" size={15} color="#447055" />
            <Text style={[styles.featureText, { color: "#272424ff" }]}>{item.feature}</Text>
          </View>
          <View style={[styles.featureChip, { borderColor: "#5f5c5cff" }]}> 
            <Ionicons name="shield-checkmark-outline" size={15} color="#447055" />
            <Text style={[styles.featureText, { color: "#272424ff" }]}>Private & secure</Text>
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
      renderNextButton={() => <SliderButton style={[styles.progressButton]} label="Next" COLORS={COLORS} FONTS={FONTS} />}
      renderDoneButton={() => <SliderButton style={[styles.progressButton]} label="Get started" COLORS={COLORS} FONTS={FONTS} />}
      onDone={() => navigation.replace('LoginScreen')}
      activeDotStyle={{ backgroundColor: "#447055", width: 10, borderRadius: 999 }}
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
    borderRadius: 16,
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
    height: 400,
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
    fontSize: 16,
    fontWeight: '500',
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
    flexDirection: 'column',
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
    alignSelf:"flex-start",
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
