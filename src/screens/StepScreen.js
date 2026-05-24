import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function StepScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();

  const dailySteps = useHealthStore((state) => state.dailySteps);
  const stepGoal = useHealthStore((state) => state.stepGoal);
  const isStepTracking = useHealthStore((state) => state.isStepTracking);
  const startLiveStepTracking = useHealthStore((state) => state.startLiveStepTracking);
  const stopLiveStepTracking = useHealthStore((state) => state.stopLiveStepTracking);
  const getStepStats = useHealthStore((state) => state.getStepStats);
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);

  const { progressPercentage, distanceKm, caloriesBurned, stepsRemaining } = getStepStats();

  const handlePremiumCardPress = () => {
    if (!isPremiumUser) {
      navigation.navigate('PaywallScreen');
    }
  };

  const handleWorkoutToggle = () => {
    if (isStepTracking) {
      stopLiveStepTracking();
      return;
    }

    startLiveStepTracking();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.background }]} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#ffe4e6', '#ccfbf1']} style={[styles.heroCard, { shadowColor: isDark ? COLORS.background : '#000000' }]}>
        <View style={styles.progressWrap}>
          <CircularProgress
            value={dailySteps}
            maxValue={stepGoal}
            radius={90}
            activeStrokeColor={COLORS.steps}
            inActiveStrokeColor={'#E2E8F0'}
            showProgressValue={false}
          />

          <View style={styles.progressCenterTextWrap}>
            <Text style={[styles.progressMainText, FONTS.bigNumbers, { color: COLORS.textMain }]}>{dailySteps}</Text>
            <Text style={[styles.progressSubText, FONTS.smallText, { color: COLORS.textMuted }]}>{`of ${stepGoal.toLocaleString()}`}</Text>
          </View>
        </View>

        <View style={[styles.goalPillCard, { backgroundColor: COLORS.card }]}> 
          <View style={styles.goalPillLeft}>
            <View style={[styles.goalIconWrap, { backgroundColor: '#EAF8F0' }]}>
              <Ionicons name="footsteps" size={18} color="#34C759" />
            </View>
            <Text style={[styles.goalPillLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Daily Goal Progress</Text>
          </View>
          <Text style={[styles.goalPillValue, FONTS.mediumNumbers, { color: COLORS.textMain }]}>{progressPercentage}%</Text>
        </View>
      </LinearGradient>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#EAF2FF' }]}>
            <Ionicons name="stats-chart" size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.metricTitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Distance</Text>
          <Text style={[styles.metricValue, FONTS.mediumNumbers, { color: COLORS.textMain }]}>{distanceKm}</Text>
          <Text style={[styles.metricCaption, FONTS.smallText, { color: COLORS.textMuted }]}>kilometers</Text>
        </View>

        <TouchableOpacity style={[styles.metricCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]} activeOpacity={0.88} onPress={handlePremiumCardPress}>
          {isPremiumUser ? (
            <>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFF2E8' }]}>
                <Ionicons name="flash" size={20} color="#F97316" />
              </View>
              <Text style={[styles.metricTitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Calories</Text>
              <Text style={[styles.metricValue, FONTS.bigNumbers, { color: COLORS.textMain }]}>{caloriesBurned}</Text>
              <Text style={[styles.metricCaption, FONTS.smallText, { color: COLORS.textMuted }]}>kcal burned</Text>
            </>
          ) : (
            <>
              <View style={[styles.metricIconWrap, { backgroundColor: '#EEF1F4' }]}>
                <Ionicons name="lock-closed" size={20} color="#8E8E93" />
              </View>
              <Text style={[styles.metricTitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Calories</Text>
              <Text style={[styles.metricValue, FONTS.bigNumbers, { color: COLORS.textMain }]}>Pro</Text>
              <Text style={[styles.metricCaption, FONTS.smallText, { color: COLORS.textMuted }]}>Unlock to view</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <LinearGradient colors={['#88dd9dff', '#477591ff']} style={styles.motivationBanner}>
        <View style={styles.motivationLeft}>
          <Text style={[styles.motivationSmall, FONTS.smallText, { color: '#FFFFFF' }]}>Keep moving!</Text>
          <Text style={[styles.motivationMain, FONTS.sectionHeading, { color: '#FFFFFF' }]}>{stepsRemaining} steps to goal</Text>
        </View>

        <Ionicons name="footsteps" size={42} color="#FFFFFF" />
      </LinearGradient>

      <TouchableOpacity
        style={[
          styles.workoutToggleCard,
          {
            backgroundColor: isStepTracking ? '#FFF2F2' : COLORS.card,
            borderColor: isStepTracking ? '#FECACA' : isDark ? '#2A2A2A' : '#E7ECF3',
            shadowColor: isDark ? COLORS.background : '#000000',
          },
        ]}
        activeOpacity={0.92}
        onPress={handleWorkoutToggle}
      >
        <View style={styles.workoutToggleCopy}>
          <View style={[styles.workoutToggleIconWrap, { backgroundColor: isStepTracking ? '#FEE2E2' : '#EAF8F0' }]}>
            <Ionicons name={isStepTracking ? 'pause' : 'play'} size={18} color={isStepTracking ? '#EF4444' : '#16A34A'} />
          </View>
          <View style={styles.workoutToggleTextWrap}>
            <Text style={[styles.workoutToggleTitle, FONTS.sectionHeading, { color: COLORS.textMain }]}>
              {isStepTracking ? 'Stop Workout' : 'Start Workout'}
            </Text>
            <Text style={[styles.workoutToggleSubtitle, FONTS.smallText, { color: COLORS.textMuted }]}>
              {isStepTracking ? 'Tap to pause live tracking' : 'Tap to begin live step tracking'}
            </Text>
          </View>
        </View>

        <View style={[styles.workoutToggleBadge, { backgroundColor: isStepTracking ? '#FEE2E2' : '#DCFCE7' }]}>
          <Text style={[styles.workoutToggleBadgeText, { color: isStepTracking ? '#B91C1C' : '#166534' }]}>
            {isStepTracking ? 'Active' : 'Ready'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[styles.workoutStatusText, FONTS.smallText, { color: COLORS.textMuted }]}>
        {isStepTracking ? 'Live step tracking is active' : 'Live step tracking is paused'}
      </Text>

      <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textMain }]}>Advanced Tracking</Text>
      <TouchableOpacity style={[styles.lockedFeatureCard, { backgroundColor: COLORS.card }]} activeOpacity={0.88} onPress={() => navigation.navigate('PaywallScreen')}>
        <View style={styles.lockedFeaturesRow}>
          <View style={styles.lockedFeatureItem}>
            <Ionicons name="calendar" size={28} color="#B4BCC9" />
            <Text style={[styles.lockedFeatureText, FONTS.smallText, { color: COLORS.textMuted }]}>Weekly Goals</Text>
          </View>

          <View style={styles.lockedFeatureItem}>
            <Ionicons name="ribbon" size={28} color="#B4BCC9" />
            <Text style={[styles.lockedFeatureText, FONTS.smallText, { color: COLORS.textMuted }]}>Achievement Badges</Text>
          </View>
        </View>

        <View style={styles.lockedOverlay}>
          <Text style={[styles.lockedOverlayText, FONTS.sectionHeading, { color: COLORS.textMain }]}>🔒 Premium Feature</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  progressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressMainText: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  progressSubText: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
  },
  goalPillCard: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  goalPillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalPillValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 18,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 14,
    color: '#697788',
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  metricCaption: {
    marginTop: 3,
    fontSize: 12,
  },
  motivationBanner: {
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  motivationLeft: {
    flex: 1,
    marginRight: 10,
  },
  motivationSmall: {
    fontSize: 13,
    opacity: 0.95,
  },
  motivationMain: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  workoutToggleCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  workoutToggleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  workoutToggleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutToggleTextWrap: {
    flex: 1,
  },
  workoutToggleTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  workoutToggleSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '600',
  },
  workoutToggleBadge: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutToggleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  workoutStatusText: {
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  lockedFeatureCard: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  lockedFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.45,
  },
  lockedFeatureItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  lockedFeatureText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedOverlayText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
