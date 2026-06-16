import { useAuth, useUser } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
    requestNotificationPermissions,
    triggerMorningNow,
    triggerTestNotification,
} from '../utils/notifications';

import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { getTodayDate, useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const weekDates = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push({
      day: dayNames[i],
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      fullDate: date,
      dateString: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    });
  }

  return weekDates;
};

const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

function GoalBar({
  iconName,
  iconColor,
  iconBg,
  title,
  metric,
  percentage,
  backgroundColor,
  textPrimary,
  textSecondary,
  progressTrack,
  onPress,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.goalCard,
        { backgroundColor },
      ]}
    >
      <View style={styles.goalTopRow}>
        <View style={styles.goalLeftWrap}>
          <View style={[styles.goalIconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>
          <View style={styles.goalTextWrap}>
            <Text style={[styles.goalTitle, { color: textPrimary }]}>{title}</Text>
            <Text style={[styles.goalMetric, { color: textSecondary }]}>{metric}</Text>
          </View>
        </View>
        <Text style={[styles.goalPercent, { color: textPrimary }]}>{percentage}%</Text>
      </View>
      <View style={[styles.goalProgressTrack, { backgroundColor: progressTrack }]}>
        <View style={[styles.goalProgressFill, { width: `${percentage}%`, backgroundColor: iconColor }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const userAvatar = useHealthStore((state) => state.userAvatar);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Initialize background services and permissions
  useEffect(() => {
    requestNotificationPermissions();
    
    // Create an async initializer for the pedometer
    const initializePedometer = async () => {
      const store = useHealthStore.getState();
      
      // 1. Trigger the OS permission prompt
      const hasPermission = await store.requestPedometerPermission();
      
      // 2. Only start the tracker if the user tapped "Allow"
      if (hasPermission) {
        await store.startLiveStepTracking();
      }
    };

    initializePedometer();
  }, []);

  useAuth();
  const { user: clerkUser } = useUser();

  const hasCelebratedToday = useHealthStore((state) => state.hasCelebratedToday);
  const lastGoalCompletionDate = useHealthStore((state) => state.lastGoalCompletionDate);
  const currentStreak = useHealthStore((state) => state.currentStreak);
  const needsDailyReview = useHealthStore((state) => state.needsDailyReview);
  const insightText = useHealthStore((state) => state.insightText);
  const checkDailyReset = useHealthStore((state) => state.checkDailyReset);
  const completeReview = useHealthStore((state) => state.completeReview);
  const setHasCelebratedToday = useHealthStore((state) => state.setHasCelebratedToday);
  const refreshDailyCelebrationState = useHealthStore((state) => state.refreshDailyCelebrationState);
  
  const dailySteps = useHealthStore((state) => state.dailySteps);
  const stepGoal = useHealthStore((state) => state.stepGoal);
  const currentWaterMl = useHealthStore((state) => state.currentWaterMl ?? state.waterIntake);
  const waterGoal = useHealthStore((state) => state.waterGoalMl ?? state.waterGoal ?? 2500);
  const sleepDuration = useHealthStore((state) => state.sleepDuration);
  const sleepGoal = useHealthStore((state) => state.sleepGoal) ?? 8;
  const weeklyProgress = useHealthStore((state) => state.weeklyProgress);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [reviewStepGoal, setReviewStepGoal] = useState(stepGoal);
  const [reviewWaterGoal, setReviewWaterGoal] = useState(waterGoal / 1000);
  const [reviewSleepGoal, setReviewSleepGoal] = useState(sleepGoal);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState(null);
  const [weekDates, setWeekDates] = useState(getWeekDates());
  
  const todayDateString = getTodayDate();
  const focusedDayIndex = weekDates.findIndex((day) => day.dateString === todayDateString);

  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkDailyReset();
      }
    });
    return () => subscription.remove();
  }, [checkDailyReset]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkDailyReset();
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [checkDailyReset]);

  useEffect(() => {
    setReviewStepGoal(stepGoal);
    setReviewWaterGoal(waterGoal / 1000);
    setReviewSleepGoal(sleepGoal);
  }, [stepGoal, waterGoal, sleepGoal]);

  useEffect(() => {
    setWeekDates(getWeekDates());
  }, []);

  useEffect(() => {
    refreshDailyCelebrationState();
    const today = getTodayDate();
    const goalCompletedToday = lastGoalCompletionDate === today;

    if (goalCompletedToday && !hasCelebratedToday) {
      setShowCelebration(true);
      setHasCelebratedToday(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 5500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasCelebratedToday, lastGoalCompletionDate, setHasCelebratedToday, refreshDailyCelebrationState]);

  const waterProgress = waterGoal > 0 ? Math.min(100, Math.round((currentWaterMl / waterGoal) * 100)) : 0;
  const stepProgress = stepGoal > 0 ? Math.min(100, Math.round((dailySteps / stepGoal) * 100)) : 0;
  const sleepProgress = sleepGoal > 0 ? Math.min(100, Math.round((sleepDuration / sleepGoal) * 100)) : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round((stepProgress + waterProgress + sleepProgress) / 3)));

  const goals = [
    {
      key: 'steps',
      iconName: 'footsteps-outline',
      iconColor: COLORS.success,
      iconBg: '#EAF8F0',
      title: 'Steps',
      metric: `${dailySteps.toLocaleString()} / ${stepGoal.toLocaleString()} steps`,
      percentage: stepProgress,
      backgroundColor: COLORS.card,
      navigationScreen: 'StepScreen',
    },
    {
      key: 'water',
      iconName: 'water-outline',
      iconColor: COLORS.success,
      iconBg: '#EAF2FF',
      title: 'Water',
      metric: `${(currentWaterMl / 1000).toFixed(1)} / ${(waterGoal / 1000).toFixed(1)} L`,
      percentage: waterProgress,
      backgroundColor: COLORS.card,
      navigationScreen: 'WaterScreen',
    },
    {
      key: 'sleep',
      iconName: 'moon-outline',
      iconColor: COLORS.purple,
      iconBg: '#F0ECFD',
      title: 'Sleep',
      metric: `${sleepDuration.toFixed(1)} / ${sleepGoal} hrs`,
      percentage: sleepProgress,
      backgroundColor: COLORS.card,
      navigationScreen: 'SleepScreen',
    },
  ];

  const dashboardCards = [
    { title: 'BMI', iconName: 'body-outline', iconColor: COLORS.BMI, iconBg: isDark ? '#1E293B' : '#FFF3E6', backgroundColor: COLORS.card, navigationScreen: 'BMIScreen' },
    { title: 'Steps', iconName: 'footsteps-outline', iconColor: COLORS.steps, iconBg: isDark ? '#163322' : '#EAF8F0', backgroundColor: COLORS.card, navigationScreen: 'StepScreen' },
    { title: 'Water', iconName: 'water-outline', iconColor: COLORS.water, iconBg: isDark ? '#102A43' : '#EAF2FF', backgroundColor: COLORS.card, navigationScreen: 'WaterScreen' },
    { title: 'Sleep', iconName: 'moon-outline', iconColor: COLORS.sleep, iconBg: isDark ? '#2A1F3D' : '#F0ECFD', backgroundColor: COLORS.card, navigationScreen: 'SleepScreen' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {showCelebration && (
          <View pointerEvents="none" style={styles.confettiOverlay}>
            <ConfettiCannon count={180} origin={{ x: screenWidth / 2, y: 0 }} fadeOut fallSpeed={3200} explosionSpeed={420} autoStart />
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={{ position: 'relative' }}>
              <View style={styles.avatar}>
                <Image
                  source={
                    userAvatar
                      ? (userAvatar.uri ? { uri: userAvatar.uri } : userAvatar)
                      : clerkUser?.imageUrl
                        ? { uri: clerkUser.imageUrl }
                        : require('../../assets/Avatars/avatar1.png')
                  }
                  style={styles.avatarImage}
                />
              </View>
              <View style={[styles.avatarEditIcon, { backgroundColor: COLORS.primary, borderColor: COLORS.background }]}>
                <Ionicons name="pencil" size={10} color={COLORS.onPrimary || '#FFFFFF'} />
              </View>
            </TouchableOpacity>

            <View style={styles.headerTitleGroup}>
              <Text style={[styles.headerAppName, { color: COLORS.textPrimary }]}>HealthMate</Text>
            </View>
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              onPress={() => navigation.navigate('StreakDetails')}
              style={[styles.streakBadge, { backgroundColor: isDark ? COLORS.surface : '#F7E7D7', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.2)' }]}
              activeOpacity={0.85}
            >
              <Ionicons name="flame-outline" size={16} color="#B25A00" />
              <Text style={[styles.streakText, { color: isDark ? '#F9C27A' : '#B25A00' }]}>{currentStreak} Days</Text>
            </TouchableOpacity>

            <View style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
            </View>
          </View>
        </View>

        {needsDailyReview ? (
          <View style={[styles.reviewCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
            <Text style={[styles.reviewGreeting, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Good Morning</Text>
            <Text style={[styles.reviewInsight, FONTS.bodyText, { color: COLORS.textSecondary }]}>{insightText}</Text>

            <View style={[styles.goalCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
              <View style={styles.goalCardRow}>
                <View style={[styles.goalIconCircle, { backgroundColor: COLORS.primaryContainer }]}>
                  <Text style={{ color: COLORS.primary, fontSize: 22 }}>🚶</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Daily Steps</Text>
                    <Text style={[FONTS.bigNumbers, { color: COLORS.primary }]}>{Math.round(reviewStepGoal)}</Text>
                  </View>
                  <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Walking helps cardiovascular health and mood.</Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={2000}
                  maximumValue={20000}
                  step={100}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewStepGoal}
                  onValueChange={(v) => setReviewStepGoal(v)}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>2,000</Text>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>20,000</Text>
                </View>
              </View>
            </View>

            <View style={[styles.goalCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
              <View style={styles.goalCardRow}>
                <View style={[styles.goalIconCircle, { backgroundColor: COLORS.secondaryContainer }]}>
                  <Text style={{ color: COLORS.secondary, fontSize: 22 }}>💧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Hydration</Text>
                    <Text style={[FONTS.mediumNumbers, { color: COLORS.secondary }]}>{reviewWaterGoal.toFixed(1)} L</Text>
                  </View>
                  <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Proper hydration maintains energy and focus.</Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0.5}
                  maximumValue={5}
                  step={0.1}
                  minimumTrackTintColor={COLORS.water}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewWaterGoal}
                  onValueChange={(v) => setReviewWaterGoal(v)}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>1.0 L</Text>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>5.0 L</Text>
                </View>
              </View>
            </View>

            <View style={[styles.goalCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
              <View style={styles.goalCardRow}>
                <View style={[styles.goalIconCircle, { backgroundColor: COLORS.tertiaryContainer }]}>
                  <Text style={{ color: COLORS.tertiary, fontSize: 22 }}>🌙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Sleep Duration</Text>
                    <Text style={[FONTS.mediumNumbers, { color: COLORS.tertiary }]}>{reviewSleepGoal} hrs</Text>
                  </View>
                  <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Consistent sleep aids recovery and memory.</Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={4}
                  maximumValue={12}
                  step={0.5}
                  minimumTrackTintColor={COLORS.purple}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewSleepGoal}
                  onValueChange={(v) => setReviewSleepGoal(v)}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>4.0 hrs</Text>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>12.0 hrs</Text>
                </View>
              </View>
            </View>

            <View style={styles.reviewActionRow}>
              <TouchableOpacity
                style={[styles.reviewActionBtn, { backgroundColor: 'transparent', borderColor: COLORS.border, borderWidth: 1 }]}
                onPress={() => {
                  setReviewStepGoal(stepGoal);
                  setReviewWaterGoal(waterGoal / 1000);
                  setReviewSleepGoal(sleepGoal);
                }}
              >
                <Text style={[styles.reviewActionBtnText, { color: COLORS.textPrimary }]}>Keep Current</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reviewActionBtn, { backgroundColor: COLORS.primary }]}
                activeOpacity={isAiLoading ? 1 : 0.85}
                disabled={isAiLoading}
                onPress={async () => {
                  if (isAiLoading) return;
                  setIsAiLoading(true);

                  try {
                    const NVIDIA_INVOKE_URL = process.env.EXPO_PUBLIC_NVIDIA_INVOKE_URL;
                    const NVIDIA_MODEL = process.env.EXPO_PUBLIC_NVIDIA_MODEL;
                    const NVIDIA_API_KEY = process.env.EXPO_PUBLIC_NVIDIA_API_KEY;

                    if (!NVIDIA_INVOKE_URL || !NVIDIA_MODEL || !NVIDIA_API_KEY) {
                      throw new Error('Missing NVIDIA API configuration');
                    }

                    const payload = {
                      model: NVIDIA_MODEL,
                      messages: [
                        {
                          role: 'system',
                          content:
                            'You are a fitness goal planning AI. Return ONLY a valid JSON object with keys suggestedStepGoal, suggestedWaterGoalMl, and suggestedSleepGoalHours. No markdown, no prose.',
                        },
                        {
                          role: 'user',
                          content: JSON.stringify({
                            dailySteps,
                            currentWaterMl,
                            sleepDuration,
                          }),
                        },
                      ],
                      max_tokens: 200,
                      temperature: 0.7,
                      top_p: 0.9,
                      stream: false,
                    };

                    const response = await axios.post(NVIDIA_INVOKE_URL, payload, {
                      headers: {
                        Authorization: `Bearer ${NVIDIA_API_KEY}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                      },
                    });

                    const aiText = response.data?.choices?.[0]?.message?.content || '';
                    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

                    if (!jsonMatch) {
                      throw new Error('AI response did not contain valid JSON');
                    }

                    const aiResponse = JSON.parse(jsonMatch[0]);
                    const suggestedStepGoal = Math.max(3000, Math.min(20000, Math.round(aiResponse.suggestedStepGoal || stepGoal)));
                    const suggestedWaterGoalMl = Math.max(1000, Math.min(6000, Math.round(aiResponse.suggestedWaterGoalMl || waterGoal)));
                    const suggestedSleepGoalHours = Math.max(4, Math.min(12, Number(aiResponse.suggestedSleepGoalHours || sleepGoal)));

                    setReviewStepGoal(suggestedStepGoal);
                    setReviewWaterGoal(suggestedWaterGoalMl / 1000);
                    setReviewSleepGoal(suggestedSleepGoalHours);
                  } catch (error) {
                    console.warn('[HomeScreen] AI suggestion failed', error);
                  } finally {
                    setIsAiLoading(false);
                  }
                }}
              >
                {isAiLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.reviewActionBtnText, { color: COLORS.onPrimary || '#FFFFFF' }]}>Use AI Suggestion</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.reviewStartBtn, { backgroundColor: COLORS.primary }]}
              activeOpacity={0.9}
              onPress={() => {
                completeReview(Math.round(reviewStepGoal), Math.round(reviewWaterGoal * 1000), reviewSleepGoal);
              }}
            >
              <Ionicons name="play-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.reviewStartBtnText, { color: '#FFFFFF' }]}>Set Goals</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.dailyHealthCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
              <View style={styles.dailyHealthTextArea}>
                <Text style={[styles.dailyHealthTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Daily Health Score</Text>
                <Text style={[styles.dailyHealthSubtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>You are doing better than 82% of users today!</Text>
              </View>

              <View style={styles.scoreRingWrap}>
                <View style={[styles.scoreHeartGhost, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)' }]}>
                  <Ionicons name="heart-outline" size={74} color={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)'} />
                </View>
                <View style={[styles.scoreRing, { borderColor: COLORS.primary }]}>
                  <Text style={[styles.scoreValue, { color: COLORS.textPrimary }]}>{healthScore}</Text>
                  <Text style={[styles.scoreDivider, { color: COLORS.textSecondary }]}>/ 100</Text>
                </View>
              </View>
            </View>

            <View style={[styles.weeklyMomentumCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
              <View style={styles.weeklyProgressHeader}>
                <Text style={[styles.weeklyProgressTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Weekly Momentum</Text>
                <TouchableOpacity onPress={() => navigation.navigate('StreakDetails')} activeOpacity={0.85}>
                  <Text style={[styles.viewDetailsText, { color: COLORS.primary }]}>View Report</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysContainer}>
                {weekDates.map((dayData, index) => {
                  const isGoalMet = Boolean(weeklyProgress && weeklyProgress[index]);
                  const isFocused = index === focusedDayIndex;

                  return (
                    <TouchableOpacity
                      key={dayData.dateString}
                      onPress={() => navigation.navigate('StreakDetails', { date: dayData.dateString })}
                      style={styles.dayCircleWrapper}
                      activeOpacity={0.9}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isGoalMet && styles.dayCircleCompleted,
                          isFocused && styles.dayCircleFocused,
                          {
                            backgroundColor: isGoalMet ? COLORS.success : isFocused ? 'transparent' : COLORS.surface,
                            borderColor: isGoalMet || isFocused ? COLORS.success : COLORS.border,
                          },
                        ]}
                      >
                        {isGoalMet ? (
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.dayDate, { color: isFocused ? COLORS.success : COLORS.textSecondary }]}>{dayData.date}</Text>
                        )}
                      </View>
                      <Text style={[styles.dayLabel, { color: isFocused ? COLORS.primary : COLORS.textMuted }]}>{dayData.day.slice(0, 1)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.weeklyMomentumFooter}>
                <Text
                  onPress={() => navigation.navigate('AnalyticsScreenPremium')}
                  style={[styles.weeklyTrendText, { color: COLORS.textSecondary }]}
                >
                  Trend: <Text style={{ color: COLORS.success, fontWeight: '800' }}>+5%</Text> from last week
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AnalyticsScreenPremium')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.weeklyReportText, { color: COLORS.primary }]}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Daily Goals</Text>

            {goals.map((goal) => (
              <GoalBar
                key={goal.key}
                iconName={goal.iconName}
                iconColor={goal.iconColor}
                iconBg={goal.iconBg}
                title={goal.title}
                metric={goal.metric}
                percentage={goal.percentage}
                backgroundColor={COLORS.card}
                textPrimary={COLORS.textPrimary}
                textSecondary={COLORS.textSecondary}
                onPress={() => navigation.navigate(goal.navigationScreen)}
                progressTrack={isDark ? '#374151' : '#EBEDF0'}
              />
            ))}

            <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Quick Actions</Text>
            <View style={styles.dashboardGrid}>
              {dashboardCards.map((card) => (
                <TouchableOpacity
                  key={card.title}
                  onPress={() => navigation.navigate(card.navigationScreen)}
                  style={[
                    styles.dashboardCard,
                    {
                      backgroundColor: card.backgroundColor,
                      shadowColor: isDark ? COLORS.background : '#000000',
                    },
                  ]}
                >
                  <View style={[styles.dashboardIconCircle]}>
                    <Ionicons name={card.iconName} size={20} color={card.iconColor} />
                  </View>
                  <Text style={[styles.dashboardTitle, { color: COLORS.textPrimary }]}>{card.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.appTipCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#232627' }]}>
              <View style={[styles.appTipBadge, { backgroundColor: isDark ? 'rgba(52, 79, 72, 0.66)' : 'rgba(163, 237, 205, 0.77)' }]}>
                <Text style={[styles.appTipBadgeText, { color: COLORS.primary }]}>PRO TIP</Text>
              </View>
              <Text style={[styles.appTipTitle, { color: COLORS.textPrimary }]}>Keep your streak alive with one quick habit.</Text>
              <Text style={[styles.appTipSubtitle, { color: COLORS.textSecondary }]}>Log water, reach today steps, and finish strong on the sleep goal.</Text>
            </View>

            {/* Debug Actions - Left intact for testing native module triggers */}
            <TouchableOpacity
              style={{ backgroundColor: 'red', padding: 15, borderRadius: 10, marginVertical: 20, alignItems: 'center' }}
              onPress={async () => {
                await triggerTestNotification();
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>TEST NOTIFICATION</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ backgroundColor: '#0a84ff', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
              onPress={async () => {
                const startLiveStepTracking = useHealthStore.getState().startLiveStepTracking;
                await startLiveStepTracking();
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>START LIVE PEDOMETER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: '#f5a623', padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center' }}
              onPress={async () => {
                await triggerMorningNow();
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>TRIGGER MORNING NOTIFICATION</Text>
            </TouchableOpacity>
          </>
        )}

        <Modal
          transparent
          visible={!!selectedDayModal}
          animationType="fade"
          onRequestClose={() => setSelectedDayModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedDayModal(null)}
              >
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, FONTS.mainHeading, { color: COLORS.textPrimary }]}>
                {selectedDayModal?.day}
              </Text>

              <View style={styles.modalDateDisplay}>
                <Text style={[styles.modalDateText, FONTS.bigNumbers, { color: COLORS.primary }]}>
                  {selectedDayModal?.date}
                </Text>
                <View style={styles.modalDateDivider} />
                <Text style={[styles.modalMonthText, FONTS.subheading, { color: COLORS.textPrimary }]}>
                  {selectedDayModal ? getMonthName(selectedDayModal.month) : ''}
                </Text>
              </View>

              <View style={styles.modalGoalStatus}>
                <Ionicons
                  name={selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)] ? 'checkmark-circle' : 'close-circle'}
                  size={32}
                  color={selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)] ? '#2ECC71' : '#E74C3C'}
                />
                <Text style={[styles.modalStatusText, FONTS.bodyText, { color: COLORS.textPrimary, marginLeft: 12 }]}>
                  {selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)]
                    ? 'Goal Achieved! 🎉'
                    : 'Goal Not Achieved'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalCloseActionBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => setSelectedDayModal(null)}
              >
                <Text style={[styles.modalCloseActionBtnText, { color: '#FFFFFF' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <AvatarSelectionModal visible={showAvatarModal} onClose={() => setShowAvatarModal(false)} currentAvatar={userAvatar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef1f7',
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 6,
    gap: 14,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleGroup: {
    marginLeft: 12,
    flexShrink: 1,
  },
  headerAppName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  headerGreeting: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingMain: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  streakBadge: {
    minWidth: 88,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  streakText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  dailyPromptCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dailyPromptTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  dailyPromptSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  dailyPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  dailyPromptMetric: {
    fontSize: 13,
    fontWeight: '700',
  },
  dailyPromptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dailyPromptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  dailyPromptBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  dailyHealthCard: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  dailyHealthTextArea: {
    flex: 1,
    paddingRight: 12,
  },
  dailyHealthTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  dailyHealthSubtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
  },
  scoreRingWrap: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreHeartGhost: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 10,
    opacity: 0.16,
  },
  scoreRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scoreValue: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  scoreDivider: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '500',
  },
  heroCard: {
    borderRadius: 18,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    minHeight: 155,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroScore: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 66,
  },
  heroCaption: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
  },
  heroIconWrap: {
    position: 'absolute',
    right: 20,
    top: 30,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 14,
  },
  goalCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
    width: '100%',
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTextWrap: {
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalMetric: {
    marginTop: 2,
    fontSize: 13,
  },
  goalPercent: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  goalProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  dashboardGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingBottom: 18,
  },
  dashboardCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    width: '31%',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
    overflow: 'hidden',
  },
  dashboardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dashboardTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
  },
  appTipCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 10,
    marginBottom: 10,
    minHeight: 170,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  appTipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  appTipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTipTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    maxWidth: '88%',
  },
  appTipSubtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: '90%',
  },
  
  reviewCard: {
    marginTop: 20,
    marginBottom: 40,
    width: '100%',
    padding: 24,
    borderRadius: 20,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  reviewGreeting: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  reviewInsight: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  reviewSliderBlock: {
    marginBottom: 24,
  },
  reviewSliderLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  reviewActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  reviewActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewStartBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  reviewStartBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  weeklyProgressCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  weeklyMomentumCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeklyProgressTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayCircleWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  dayCircleCompleted: {
    borderWidth: 0,
  },
  dayCircleFocused: {
    borderWidth: 2,
    borderStyle: 'dotted',
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '800',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  weeklyMomentumFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weeklyTrendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  weeklyReportText: {
    fontSize: 13,
    fontWeight: '700',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 20,
  },
  modalDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalDateText: {
    fontSize: 48,
    fontWeight: '800',
  },
  modalDateDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  modalMonthText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalGoalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseActionBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
