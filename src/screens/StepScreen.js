import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function StepScreen({ navigation }) {
  const { COLORS, FONTS, isDark, SHADOWS } = useTheme();

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

  const handleWorkoutToggle = async () => {
    if (isStepTracking) {
      stopLiveStepTracking();
      return;
    }
    await startLiveStepTracking();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: COLORS.background }]} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, { backgroundColor: COLORS.card }, SHADOWS.small]}>
        <View style={styles.progressWrap}>
          <CircularProgress
            value={dailySteps}
            maxValue={stepGoal}
            radius={90}
            activeStrokeColor={COLORS.steps}
            inActiveStrokeColor={COLORS.border}
            showProgressValue={false}
            activeStrokeWidth={12}
            inActiveStrokeWidth={12}
          />
          <View style={styles.progressCenterTextWrap}>
            <Text style={[FONTS.bigNumbers, { color: COLORS.textPrimary }]}>{dailySteps}</Text>
            <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>{`of ${stepGoal.toLocaleString()}`}</Text>
          </View>
        </View>

        <View style={[styles.goalPillCard, { backgroundColor: COLORS.surface }]}> 
          <View style={styles.goalPillLeft}>
            <View style={[styles.goalIconWrap, { backgroundColor: COLORS.primaryContainer }]}>
              <Ionicons name="footsteps" size={16} color={COLORS.primary} />
            </View>
            <Text style={[FONTS.bodyText, { color: COLORS.textSecondary }]}>Daily Goal Progress</Text>
          </View>
          <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary }]}>{progressPercentage}%</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: COLORS.card }, SHADOWS.small]}>
          <View style={[styles.metricIconWrap, { backgroundColor: COLORS.secondaryContainer }]}>
            <Ionicons name="stats-chart" size={20} color={COLORS.info} />
          </View>
          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 4 }]}>Distance</Text>
          <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary, marginBottom: 2 }]}>{distanceKm}</Text>
          <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>kilometers</Text>
        </View>

        <TouchableOpacity 
          style={[styles.metricCard, { backgroundColor: COLORS.card }, SHADOWS.small]} 
          activeOpacity={0.88} 
          onPress={handlePremiumCardPress}
        >
          {isPremiumUser ? (
            <>
              <View style={[styles.metricIconWrap, { backgroundColor: COLORS.tertiaryContainer }]}>
                <Ionicons name="flash" size={20} color={COLORS.calories} />
              </View>
              <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 4 }]}>Calories</Text>
              <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary, marginBottom: 2 }]}>{caloriesBurned}</Text>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>kcal burned</Text>
            </>
          ) : (
            <>
              <View style={[styles.metricIconWrap, { backgroundColor: COLORS.surface }]}>
                <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
              </View>
              <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 4 }]}>Calories</Text>
              <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary, marginBottom: 2 }]}>Pro</Text>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>Unlock to view</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.motivationBanner, { backgroundColor: COLORS.primaryContainer }]}>
        <View style={styles.motivationLeft}>
          <Text style={[FONTS.smallText, { color: COLORS.primary }]}>Keep moving!</Text>
          <Text style={[FONTS.sectionHeading, { color: COLORS.primary, marginTop: 4 }]}>{stepsRemaining} steps to goal</Text>
        </View>
        <Ionicons name="footsteps" size={36} color={COLORS.primary} />
      </View>

      <TouchableOpacity
        style={[
          styles.workoutToggleCard,
          {
            backgroundColor: isStepTracking ? COLORS.tertiaryContainer : COLORS.card,
            borderColor: isStepTracking ? COLORS.tertiary : COLORS.border,
            borderWidth: 1,
          },
          SHADOWS.small
        ]}
        activeOpacity={0.92}
        onPress={handleWorkoutToggle}
      >
        <View style={styles.workoutToggleCopy}>
          <View style={[styles.workoutToggleIconWrap, { backgroundColor: isStepTracking ? COLORS.error + '20' : COLORS.success + '20' }]}>
            <Ionicons name={isStepTracking ? 'pause' : 'play'} size={18} color={isStepTracking ? COLORS.error : COLORS.success} />
          </View>
          <View style={styles.workoutToggleTextWrap}>
            <Text style={[FONTS.subheading, { color: COLORS.textPrimary }]}>
              {isStepTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
            <Text style={[FONTS.smallText, { color: COLORS.textMuted, marginTop: 2 }]}>
              {isStepTracking ? 'Live UI updates active' : 'Tracking paused on UI'}
            </Text>
          </View>
        </View>

        <View style={[styles.workoutToggleBadge, { backgroundColor: isStepTracking ? COLORS.error + '20' : COLORS.success + '20' }]}>
          <Text style={[FONTS.smallText, { color: isStepTracking ? COLORS.error : COLORS.success, fontWeight: '700' }]}>
            {isStepTracking ? 'Active' : 'Ready'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginTop: 24, marginBottom: 12 }]}>
        Advanced Tracking
      </Text>

      <TouchableOpacity 
        style={[styles.lockedFeatureCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 }]} 
        activeOpacity={0.88} 
        onPress={() => navigation.navigate('PaywallScreen')}
      >
        <View style={styles.lockedFeaturesRow}>
          <View style={styles.lockedFeatureItem}>
            <Ionicons name="calendar" size={28} color={COLORS.textMuted} />
            <Text style={[FONTS.smallText, { color: COLORS.textMuted, marginTop: 8 }]}>Weekly Goals</Text>
          </View>

          <View style={styles.lockedFeatureItem}>
            <Ionicons name="ribbon" size={28} color={COLORS.textMuted} />
            <Text style={[FONTS.smallText, { color: COLORS.textMuted, marginTop: 8 }]}>Achievement Badges</Text>
          </View>
        </View>

        <View style={[styles.lockedOverlay, { backgroundColor: isDark ? 'rgba(11, 18, 16, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
          <Text style={[FONTS.subheading, { color: COLORS.textPrimary }]}>🔒 Premium Feature</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  progressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  progressCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPillCard: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  motivationBanner: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  motivationLeft: {
    flex: 1,
    marginRight: 12,
  },
  workoutToggleCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutToggleCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  workoutToggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  workoutToggleTextWrap: {
    flex: 1,
  },
  workoutToggleBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedFeatureCard: {
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  lockedFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    opacity: 0.7,
  },
  lockedFeatureItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});