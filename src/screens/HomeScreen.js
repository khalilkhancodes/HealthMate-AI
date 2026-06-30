import { useAuth, useUser } from '@clerk/expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle } from 'react-native-svg'; // ─── NEW IMPORT FOR PROGRESS RING ───
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
// ─── PREMIUM METRIC TILE ──────────────────────────────────────────────────
function MetricTile({ iconName, iconColor, iconBg, label, value, unit, percentage, accentColor, cardBg, textPrimary, textSecondary, borderColor, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.metricTile, { backgroundColor: cardBg, borderColor }]} activeOpacity={0.82}>
      <View style={styles.metricTileTop}>
        <View style={[styles.metricTileIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <Text style={[styles.metricTileLabel, { color: textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.metricTileValue, { color: textPrimary }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.metricTileUnit, { color: textSecondary }]}>{unit}</Text>
      <View style={[styles.metricBar, { backgroundColor: borderColor }]}>
        <View style={[styles.metricBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: accentColor }]} />
      </View>
      <Text style={[styles.metricPct, { color: accentColor }]}>{percentage}%</Text>
    </TouchableOpacity>
  );
}
export default function HomeScreen({ navigation }) {
  const { COLORS, isDark } = useTheme();
  // Fetch name and avatar from Zustand
  const userAvatar = useHealthStore((state) => state.userAvatar);
  const name = useHealthStore((state) => state.name);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
  const completionHistory = useHealthStore((state) => state.completionHistory) || {};
  const [showCelebration, setShowCelebration] = useState(false);
  const [reviewStepGoal, setReviewStepGoal] = useState(stepGoal);
  const [reviewWaterGoal, setReviewWaterGoal] = useState(waterGoal / 1000);
  const [reviewSleepGoal, setReviewSleepGoal] = useState(sleepGoal);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedDayModal, setSelectedDayModal] = useState(null);
  const [weekDates, setWeekDates] = useState(getWeekDates());
  const todayDateString = getTodayDate();
  const focusedDayIndex = weekDates.findIndex((day) => day.dateString === todayDateString);
  useEffect(() => { checkDailyReset(); }, [checkDailyReset]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkDailyReset();
    });
    return () => subscription.remove();
  }, [checkDailyReset]);
  useEffect(() => {
    const intervalId = setInterval(() => checkDailyReset(), 60 * 1000);
    return () => clearInterval(intervalId);
  }, [checkDailyReset]);
  useEffect(() => {
    setReviewStepGoal(stepGoal);
    setReviewWaterGoal(waterGoal / 1000);
    setReviewSleepGoal(sleepGoal);
  }, [stepGoal, waterGoal, sleepGoal]);
  useEffect(() => { setWeekDates(getWeekDates()); }, []);
  useEffect(() => {
    refreshDailyCelebrationState();
    const today = getTodayDate();
    const goalCompletedToday = lastGoalCompletionDate === today;
    if (goalCompletedToday && !hasCelebratedToday) {
      setShowCelebration(true);
      setHasCelebratedToday(true);
      const timer = setTimeout(() => setShowCelebration(false), 5500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasCelebratedToday, lastGoalCompletionDate, setHasCelebratedToday, refreshDailyCelebrationState]);
  const waterProgress = waterGoal > 0 ? Math.min(100, Math.round((currentWaterMl / waterGoal) * 100)) : 0;
  const stepProgress = stepGoal > 0 ? Math.min(100, Math.round((dailySteps / stepGoal) * 100)) : 0;
  const sleepProgress = sleepGoal > 0 ? Math.min(100, Math.round((sleepDuration / sleepGoal) * 100)) : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round((stepProgress + waterProgress + sleepProgress) / 3)));
  // ─── CIRCULAR PROGRESS MATH ───
  const ringSize = 108;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * healthScore) / 100;
  // ─── DYNAMIC USER NAME ───
  const displayName = name || clerkUser?.firstName + ' ' + clerkUser?.lastName || 'HealthMate';
  let scoreLabel = 'Get Started';
  let scoreSub = 'Log your first activity today.';
  if (healthScore >= 90) { scoreLabel = 'Excellent'; scoreSub = 'You\'re crushing all your goals today.'; }
  else if (healthScore >= 70) { scoreLabel = 'On Track'; scoreSub = 'Great momentum — keep it going.'; }
  else if (healthScore >= 40) { scoreLabel = 'In Progress'; scoreSub = 'Steady progress. Finish strong.'; }
  else if (healthScore > 0) { scoreLabel = 'Just Started'; scoreSub = 'Every step forward counts.'; }
  const calculateTrend = () => {
    const today = new Date();
    let currentWeekCompletions = 0;
    let lastWeekCompletions = 0;
    for (let i = 0; i < 7; i++) {
      const d1 = new Date(today); d1.setDate(today.getDate() - i);
      const dateStr1 = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
      if (completionHistory[dateStr1]) currentWeekCompletions++;
      const d2 = new Date(today); d2.setDate(today.getDate() - (i + 7));
      const dateStr2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
      if (completionHistory[dateStr2]) lastWeekCompletions++;
    }
    if (lastWeekCompletions === 0) return currentWeekCompletions > 0 ? 100 : 0;
    return Math.round(((currentWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100);
  };
  const trendValue = calculateTrend();
  const trendIsPositive = trendValue >= 0;
  const trendString = `${trendIsPositive && trendValue !== 0 ? '+' : ''}${trendValue}%`;
  const trendColor = trendIsPositive ? COLORS.success : '#E74C3C';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const surfaceMuted = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const quickActions = [
    { title: 'BMI', iconName: 'body-outline', iconColor: COLORS.BMI, iconBg: isDark ? '#1E293B' : '#FFF3E6', navigationScreen: 'BMIScreen' },
    { title: 'Steps', iconName: 'footsteps-outline', iconColor: COLORS.steps, iconBg: isDark ? '#163322' : '#EAF8F0', navigationScreen: 'StepScreen' },
    { title: 'Water', iconName: 'water-outline', iconColor: COLORS.water, iconBg: isDark ? '#102A43' : '#EAF2FF', navigationScreen: 'WaterScreen' },
    { title: 'Sleep', iconName: 'moon-outline', iconColor: COLORS.sleep, iconBg: isDark ? '#2A1F3D' : '#F0ECFD', navigationScreen: 'SleepScreen' },
  ];
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {showCelebration && (
          <View pointerEvents="none" style={styles.confettiOverlay}>
            <ConfettiCannon count={180} origin={{ x: screenWidth / 2, y: 0 }} fadeOut fallSpeed={3200} explosionSpeed={420} autoStart />
          </View>
        )}
        {/* ─── HEADER ─────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setShowAvatarModal(true)} activeOpacity={0.85}>
              <View style={[styles.avatarRing, { borderColor: COLORS.primary }]}>
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
              <View style={[styles.avatarEditDot, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="pencil" size={9} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.headerEyebrow, { color: COLORS.textSecondary }]}>GOOD {getGreeting().toUpperCase()}</Text>
              <Text style={[styles.headerAppName, { color: COLORS.textPrimary }]}>{displayName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('StreakDetails')}
              style={[styles.streakPill, { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FEF3C7', borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.4)' }]}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text style={[styles.streakNum, { color: isDark ? '#FBBF24' : '#B45309' }]}>{currentStreak}</Text>
              <Text style={[styles.streakDays, { color: isDark ? '#F59E0B' : '#D97706' }]}>days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationCenterScreen')}
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: cardBorder }]}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* ─── DAILY REVIEW ────────────────────────────────── */}
        {needsDailyReview ? (
          <View style={[styles.reviewCard, { backgroundColor: COLORS.card, borderColor: cardBorder }]}>
            <View style={[styles.reviewBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
              <Text style={[styles.reviewBadgeText, { color: COLORS.primary }]}>MORNING CHECK-IN</Text>
            </View>
            <Text style={[styles.reviewHeading, { color: COLORS.textPrimary }]}>Set Today&apos;s Goals</Text>
            <Text style={[styles.reviewInsight, { color: COLORS.textSecondary }]}>{insightText}</Text>
            {[
              { emoji: '🚶', label: 'Daily Steps', color: COLORS.primary, value: Math.round(reviewStepGoal).toLocaleString(), unit: 'steps', min: 2000, max: 20000, step: 100, minLabel: '2,000', maxLabel: '20,000', val: reviewStepGoal, onChange: setReviewStepGoal },
              { emoji: '💧', label: 'Hydration', color: COLORS.water, value: reviewWaterGoal.toFixed(1), unit: 'litres', min: 0.5, max: 5, step: 0.1, minLabel: '0.5 L', maxLabel: '5.0 L', val: reviewWaterGoal, onChange: setReviewWaterGoal },
              { emoji: '🌙', label: 'Sleep Duration', color: COLORS.sleep, value: reviewSleepGoal, unit: 'hours', min: 4, max: 12, step: 0.5, minLabel: '4 hrs', maxLabel: '12 hrs', val: reviewSleepGoal, onChange: setReviewSleepGoal },
            ].map((item, i) => (
              <View key={i} style={[styles.reviewGoalRow, { borderColor: cardBorder }]}>
                <View style={styles.reviewGoalHeader}>
                  <View style={styles.reviewGoalLeft}>
                    <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                    <Text style={[styles.reviewGoalLabel, { color: COLORS.textPrimary }]}>{item.label}</Text>
                  </View>
                  <View style={styles.reviewGoalValueWrap}>
                    <Text style={[styles.reviewGoalValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={[styles.reviewGoalUnit, { color: COLORS.textSecondary }]}>{item.unit}</Text>
                  </View>
                </View>
                <Slider
                  style={{ width: '100%', height: 36, marginTop: 4 }}
                  minimumValue={item.min} maximumValue={item.max} step={item.step}
                  minimumTrackTintColor={item.color} maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  value={item.val} onValueChange={item.onChange}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[styles.sliderTick, { color: COLORS.textSecondary }]}>{item.minLabel}</Text>
                  <Text style={[styles.sliderTick, { color: COLORS.textSecondary }]}>{item.maxLabel}</Text>
                </View>
              </View>
            ))}
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={[styles.reviewSecondaryBtn, { borderColor: cardBorder }]}
                onPress={() => { setReviewStepGoal(stepGoal); setReviewWaterGoal(waterGoal / 1000); setReviewSleepGoal(sleepGoal); }}
              >
                <Text style={[styles.reviewSecondaryText, { color: COLORS.textPrimary }]}>Keep Current</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewAiBtn, { backgroundColor: COLORS.primary }]}
                disabled={isAiLoading}
                onPress={async () => {
                  if (isAiLoading) return;
                  setIsAiLoading(true);
                  try {
                    const PROXY_URL = 'https://healthmate-backend-eta.vercel.app/api/chat';
                    // Aggregate data for the AI Coach
                    const userProfile = {
                      dailySteps,
                      currentWaterMl: currentWaterMl || 0,
                      sleepDuration,
                      currentStreak,
                      stepGoal,
                      waterGoalMl: waterGoal,
                      sleepGoal,
                      completionHistory,
                      lastGoalCompletionDate,
                      currentDate: todayDateString,
                      currentStreakDays: currentStreak,
                      weight: useHealthStore.getState().weight,
                      activityLevel: useHealthStore.getState().activityLevel,
                      primaryHealthGoal: useHealthStore.getState().primaryHealthGoal,
                      // weekly analytics: steps, water, sleep averages and trends
                      weeklyAnalytics: {
                        averageSteps: Math.round(weeklyProgress.reduce((sum, val) => sum + (val ? 1 : 0), 0) / 7 * stepGoal),
                        averageWaterMl: Math.round(weeklyProgress.reduce((sum, val) => sum + (val ? 1 : 0), 0) / 7 * waterGoal),
                        averageSleepHours: Math.round(weeklyProgress.reduce((sum, val) => sum + (val ? 1 : 0), 0) / 7 * sleepGoal),
                      },
                    };
                    const systemPrompt = `You are an elite health scientist, behavioral psychologist, sports physiologist, and habit-coaching AI.
Your task is to analyze the user's current health data and generate personalized daily targets that maximize long-term adherence, health improvement, and habit consistency.
USER DATA PROVIDED:
* Current daily steps
* Current water intake
* Current sleep duration
* Current streak
* Current goals
* Completion history
* Last goal completion date
* Weight
* Activity level
* Primary health goal
* Weekly averages and trends
GOAL GENERATION RULES
1. CONSISTENCY FIRST
   Never aggressively increase goals.
   Long-term consistency is more important than short-term intensity.
2. PROGRESSIVE OVERLOAD
   If:
* currentStreak >= 3
* user completed goals recently
* weekly averages exceed current goals
Then increase:
* Steps by 3-5%
* Water by 3-5%
* Sleep by 0-0.25 hours
3. RECOVERY PROTOCOL
   If:
* User failed goals yesterday
* Streak was broken
* Weekly averages are significantly below goals
Then reduce:
* Steps by 5-10%
* Water by 5-10%
* Sleep by 0-0.5 hours
Purpose:
Restore confidence and rebuild momentum.
4. GOAL-SPECIFIC OPTIMIZATION
If primaryHealthGoal = lose_weight:
* Favor increased steps
* Maintain water target
* Sleep minimum 7.5 hours
If primaryHealthGoal = gain_weight:
* Moderate steps
* Prioritize recovery and sleep
If primaryHealthGoal = improve_fitness:
* Increase steps more aggressively
If primaryHealthGoal = improve_sleep:
* Prioritize sleep target adjustments
If primaryHealthGoal = maintain_health:
* Use conservative adjustments
5. ACTIVITY LEVEL MULTIPLIER
Sedentary:
Target range 3000-7000 steps
Light:
Target range 5000-9000 steps
Moderate:
Target range 7000-12000 steps
Active:
Target range 10000-20000 steps
6. WEIGHT-BASED WATER FORMULA
RecommendedWaterMl =
weight × 35
Adjustments:
Moderate Activity:
+300 ml
Active:
+500 ml
Never exceed 6000 ml.
Never go below 1500 ml.
7. SLEEP OPTIMIZATION
Default target:
8 hours
If weekly sleep average < goal:
Increase gradually by 0.25 hours.
If user consistently exceeds goal:
Maintain current target.
Never exceed 12 hours.
Never go below 6 hours.
8. STREAK PRESERVATION MODE
If currentStreak >= 7:
Avoid increasing all goals simultaneously.
Increase only the metric showing strongest consistency.
Protect streak continuity.
9. TREND ANALYSIS
Compare:
* Current metrics
* Weekly averages
* Current goals
Determine whether performance trend is:
"improving"
"stable"
"declining"
10. COACHING INSIGHT
Generate a concise motivational insight.
Examples:
"Excellent consistency this week. Small progression recommended."
"Focus on rebuilding momentum today."
"Sleep recovery should be prioritized."
"Hydration is currently your strongest habit."
OUTPUT REQUIREMENTS
Return ONLY valid raw JSON.
{
"suggestedStepGoal": number,
"suggestedWaterGoalMl": number,
"suggestedSleepGoalHours": number,
"performanceTrend": "improving|stable|declining",
"confidenceScore": number,
"reasoning": "short explanation",
"coachingInsight": "short motivational message"
}
ABSOLUTE LIMITS
Steps:
3000-20000
Water:
1500-6000
Sleep:
6-12
No markdown.
No explanations.
No extra text.
Return JSON only.
`;
                    const response = await fetch(PROXY_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messages: [
                          { role: 'system', content: systemPrompt },
                          { role: 'user', content: JSON.stringify(userProfile) }
                        ],
                        model: 'meta/llama-3.1-70b-instruct' // Route to text model
                      })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Proxy failed');
                    const aiText = data.choices?.[0]?.message?.content || '';
                    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error('AI response did not contain valid JSON');
                    const aiResponse = JSON.parse(jsonMatch[0]);
                    setReviewStepGoal(Math.max(3000, Math.min(20000, Math.round(aiResponse.suggestedStepGoal || stepGoal))));
                    setReviewWaterGoal(Math.max(1000, Math.min(6000, Math.round(aiResponse.suggestedWaterGoalMl || waterGoal))) / 1000);
                    setReviewSleepGoal(Math.max(4, Math.min(12, Number(aiResponse.suggestedSleepGoalHours || sleepGoal))));
                  } catch (error) {
                    console.warn('[AI Suggestion] Error:', error.message);
                    alert('Failed to connect to AI Coach. Please set goals manually.');
                  } finally {
                    setIsAiLoading(false);
                  }
                }}
              >
                {isAiLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                  <><Ionicons name="sparkles-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} /><Text style={styles.reviewAiText}>AI Suggest</Text></>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.reviewStartBtn, { backgroundColor: COLORS.primary }]}
              activeOpacity={0.9}
              onPress={() => completeReview(Math.round(reviewStepGoal), Math.round(reviewWaterGoal * 1000), reviewSleepGoal)}
            >
              <Ionicons name="play-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.reviewStartText}>Start My Day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ─── HEALTH SCORE HERO ─────────────────────────── */}
            <View style={[styles.heroCard, { backgroundColor: COLORS.card, borderColor: cardBorder }]}>
              {/* Left column */}
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : surfaceMuted }]}>
                  <View style={[styles.heroBadgeDot, { backgroundColor: healthScore >= 70 ? COLORS.success : COLORS.primary }]} />
                  <Text style={[styles.heroBadgeText, { color: COLORS.textSecondary }]}>DAILY SCORE</Text>
                </View>
                <Text style={[styles.heroScoreLabel, { color: COLORS.textPrimary }]}>{scoreLabel}</Text>
                <Text style={[styles.heroScoreSub, { color: COLORS.textSecondary }]}>{scoreSub}</Text>
                {/* Mini stat row */}
                <View style={styles.heroStatRow}>
                  <View style={styles.heroStat}>
                    <View style={[styles.heroStatDot, { backgroundColor: COLORS.success }]} />
                    <Text style={[styles.heroStatLabel, { color: COLORS.textSecondary }]}>{stepProgress}% steps</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <View style={[styles.heroStatDot, { backgroundColor: COLORS.water || '#3B82F6' }]} />
                    <Text style={[styles.heroStatLabel, { color: COLORS.textSecondary }]}>{waterProgress}% hydrated</Text>
                  </View>
                </View>
              </View>
              {/* ─── UPDATED: DYNAMIC SVG SCORE RING ────────── */}
              <View style={styles.heroRingWrap}>
                <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} style={{ position: 'absolute' }}>
                  {/* Background Track Circle */}
                  <Circle
                    cx={ringSize / 2} cy={ringSize / 2} r={radius}
                    stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Progress Fill Circle */}
                  <Circle
                    cx={ringSize / 2} cy={ringSize / 2} r={radius}
                    stroke={COLORS.primary}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    originX={ringSize / 2}
                    originY={ringSize / 2}
                  />
                </Svg>
                {/* Text overlay exactly inside the ring */}
                <View style={[styles.heroRingInner, { borderColor: 'transparent' }]}>
                  <Text style={[styles.heroScore, { color: COLORS.textPrimary }]}>{healthScore}</Text>
                  <Text style={[styles.heroScoreDivider, { color: COLORS.textSecondary }]}>/ 100</Text>
                </View>
              </View>
            </View>
            {/* ─── METRIC TILES (Steps / Water / Sleep) ─────── */}
            <Text style={[styles.sectionEyebrow, { color: COLORS.textSecondary }]}>TODAY&apos;S GOALS</Text>
            <View style={styles.metricRow}>
              <MetricTile
                iconName="footsteps-outline" iconColor={COLORS.success} iconBg={isDark ? '#163322' : '#EAF8F0'}
                label="Steps" value={dailySteps.toLocaleString()} unit={`of ${stepGoal.toLocaleString()}`}
                percentage={stepProgress} accentColor={COLORS.success}
                cardBg={COLORS.card} textPrimary={COLORS.textPrimary} textSecondary={COLORS.textSecondary} borderColor={cardBorder}
                onPress={() => navigation.navigate('StepScreen')}
              />
              <MetricTile
                iconName="water-outline" iconColor={COLORS.water || '#3B82F6'} iconBg={isDark ? '#102A43' : '#EAF2FF'}
                label="Water" value={`${(currentWaterMl / 1000).toFixed(1)}L`} unit={`of ${(waterGoal / 1000).toFixed(1)}L`}
                percentage={waterProgress} accentColor={COLORS.water || '#3B82F6'}
                cardBg={COLORS.card} textPrimary={COLORS.textPrimary} textSecondary={COLORS.textSecondary} borderColor={cardBorder}
                onPress={() => navigation.navigate('WaterScreen')}
              />
              <MetricTile
                iconName="moon-outline" iconColor={COLORS.purple || '#8B5CF6'} iconBg={isDark ? '#2A1F3D' : '#F0ECFD'}
                label="Sleep" value={sleepDuration.toFixed(1)} unit={`of ${sleepGoal}hrs`}
                percentage={sleepProgress} accentColor={COLORS.purple || '#8B5CF6'}
                cardBg={COLORS.card} textPrimary={COLORS.textPrimary} textSecondary={COLORS.textSecondary} borderColor={cardBorder}
                onPress={() => navigation.navigate('SleepScreen')}
              />
            </View>
            {/* ─── WEEKLY MOMENTUM ──────────────────────────── */}
            <View style={[styles.momentumCard, { backgroundColor: COLORS.card, borderColor: cardBorder }]}>
              <View style={styles.momentumHeader}>
                <View>
                  <Text style={[styles.sectionEyebrowInline, { color: COLORS.textSecondary }]}>THIS WEEK</Text>
                  <Text style={[styles.momentumTitle, { color: COLORS.textPrimary }]}>Weekly Momentum</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('StreakDetails')} activeOpacity={0.8}>
                  <Text style={[styles.linkText, { color: COLORS.primary }]}>Report →</Text>
                </TouchableOpacity>
              </View>
              {/* Day strip */}
              <View style={styles.dayStrip}>
                {weekDates.map((dayData, index) => {
                  const isGoalMet = Boolean(weeklyProgress && weeklyProgress[index]);
                  const isFocused = index === focusedDayIndex;
                  return (
                    <TouchableOpacity
                      key={dayData.dateString}
                      onPress={() => navigation.navigate('StreakDetails', { date: dayData.dateString })}
                      style={styles.dayCol}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dayLetter, { color: isFocused ? COLORS.primary : COLORS.textSecondary }]}>
                        {dayData.day.slice(0, 1)}
                      </Text>
                      <View style={[
                        styles.dayPill,
                        {
                          backgroundColor: isGoalMet
                            ? COLORS.success
                            : isFocused
                              ? 'transparent'
                              : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          borderColor: isGoalMet
                            ? COLORS.success
                            : isFocused
                              ? COLORS.primary
                              : 'transparent',
                          borderWidth: isFocused ? 1.5 : 0,
                        },
                      ]}>
                        {isGoalMet
                          ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          : <Text style={[styles.dayNum, { color: isFocused ? COLORS.primary : COLORS.textSecondary }]}>{dayData.date}</Text>
                        }
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Trend footer */}
              <View style={[styles.momentumFooter, { borderTopColor: cardBorder }]}>
                <View style={styles.momentumTrendWrap}>
                  <Ionicons
                    name={trendIsPositive ? 'trending-up-outline' : 'trending-down-outline'}
                    size={16} color={trendColor}
                  />
                  <Text style={[styles.momentumTrend, { color: COLORS.textSecondary }]}>
                    {' '}vs last 7 days: <Text style={{ color: trendColor, fontWeight: '700' }}>{trendString}</Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AnalyticsScreenPremium')} activeOpacity={0.8}>
                  <Text style={[styles.linkText, { color: COLORS.primary }]}>Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* ─── QUICK ACTIONS ───────────────────────────── */}
            <Text style={[styles.sectionEyebrow, { color: COLORS.textSecondary }]}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((card) => (
                <TouchableOpacity
                  key={card.title}
                  onPress={() => navigation.navigate(card.navigationScreen)}
                  style={[styles.quickCard, { backgroundColor: COLORS.card, borderColor: cardBorder }]}
                  activeOpacity={0.82}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: card.iconBg }]}>
                    <Ionicons name={card.iconName} size={22} color={card.iconColor} />
                  </View>
                  <Text style={[styles.quickCardTitle, { color: COLORS.textPrimary }]}>{card.title}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
                </TouchableOpacity>
              ))}
            </View>
            {/* ─── TIP CARD ────────────────────────────────── */}
            <View style={[styles.tipCard, { backgroundColor: COLORS.card, borderColor: cardBorder }]}>
              <View style={[styles.tipAccent, { backgroundColor: COLORS.primary }]} />
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text style={[styles.tipEyebrow, { color: COLORS.primary }]}>PRO TIP</Text>
                <Text style={[styles.tipTitle, { color: COLORS.textPrimary }]}>
                  One small habit keeps your streak alive.
                </Text>
                <Text style={[styles.tipSub, { color: COLORS.textSecondary }]}>
                  Log water, hit your step goal, and wind down on time — a consistent streak compounds over weeks.
                </Text>
              </View>
            </View>
          </>
        )}
        {/* ─── DAY MODAL ───────────────────────────────────── */}
        <Modal transparent visible={!!selectedDayModal} animationType="fade" onRequestClose={() => setSelectedDayModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: COLORS.card, borderColor: cardBorder }]}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedDayModal(null)}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalDay, { color: COLORS.textPrimary }]}>{selectedDayModal?.day}</Text>
              <View style={styles.modalDateRow}>
                <Text style={[styles.modalDateNum, { color: COLORS.primary }]}>{selectedDayModal?.date}</Text>
                <View style={[styles.modalDateSep, { backgroundColor: cardBorder }]} />
                <Text style={[styles.modalDateMonth, { color: COLORS.textPrimary }]}>
                  {selectedDayModal ? getMonthName(selectedDayModal.month) : ''}
                </Text>
              </View>
              <View style={[styles.modalStatus, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Ionicons
                  name={selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)] ? 'checkmark-circle' : 'close-circle'}
                  size={28}
                  color={selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)] ? '#2ECC71' : '#E74C3C'}
                />
                <Text style={[styles.modalStatusText, { color: COLORS.textPrimary }]}>
                  {selectedDayModal && weeklyProgress && weeklyProgress[weekDates.findIndex(d => d.dateString === selectedDayModal.dateString)] ? 'Goal Achieved! 🎉' : 'Goal Not Achieved'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={() => setSelectedDayModal(null)}>
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <AvatarSelectionModal visible={showAvatarModal} onClose={() => setShowAvatarModal(false)} currentAvatar={userAvatar} />
    </SafeAreaView>
  );
}
// Helper
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 100 },
  confettiOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, elevation: 999 },
  // ── Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  headerAppName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditDot: { position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  streakNum: { fontSize: 15, fontWeight: '800' },
  streakDays: { fontSize: 12, fontWeight: '600' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  // ── Hero card
  heroCard: { borderRadius: 24, padding: 22, marginBottom: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 12, gap: 6 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroScoreLabel: { fontSize: 26, fontWeight: '800', lineHeight: 30, letterSpacing: -0.5, marginBottom: 6 },
  heroScoreSub: { fontSize: 13, lineHeight: 18, fontWeight: '500', marginBottom: 14 },
  heroStatRow: { flexDirection: 'row', gap: 12 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatDot: { width: 7, height: 7, borderRadius: 3.5 },
  heroStatLabel: { fontSize: 11, fontWeight: '600' },
  heroRingWrap: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  heroRingOuter: { width: 108, height: 108, borderRadius: 54, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
  heroRingInner: { width: 82, height: 82, borderRadius: 41, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  heroScore: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  heroScoreDivider: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  // ── Section labels
  sectionEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12, marginTop: 4 },
  sectionEyebrowInline: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  // ── Metric tiles
  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  metricTile: { flex: 1, borderRadius: 20, padding: 14, borderWidth: 1 },
  metricTileTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  metricTileIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricTileLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  metricTileValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 },
  metricTileUnit: { fontSize: 10, fontWeight: '600', marginTop: 2, marginBottom: 10 },
  metricBar: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  metricBarFill: { height: '100%', borderRadius: 2 },
  metricPct: { fontSize: 10, fontWeight: '700' },
  // ── Momentum card
  momentumCard: { borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1 },
  momentumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  momentumTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  dayStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayCol: { alignItems: 'center', gap: 6, flex: 1 },
  dayLetter: { fontSize: 11, fontWeight: '700' },
  dayPill: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontWeight: '700' },
  momentumFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 1 },
  momentumTrendWrap: { flexDirection: 'row', alignItems: 'center' },
  momentumTrend: { fontSize: 12, fontWeight: '500' },
  linkText: { fontSize: 13, fontWeight: '700' },
  // ── Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickCard: { width: (screenWidth - 18 * 2 - 10) / 2, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickCardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  // ── Tip card
  tipCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, marginBottom: 12 },
  tipAccent: { width: 4, borderRadius: 2 },
  tipEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  tipTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  tipSub: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  // ── Review card
  reviewCard: { marginTop: 8, marginBottom: 40, borderRadius: 24, padding: 24, borderWidth: 1 },
  reviewBadge: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  reviewBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  reviewHeading: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  reviewInsight: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  reviewGoalRow: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  reviewGoalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewGoalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewGoalLabel: { fontSize: 15, fontWeight: '700' },
  reviewGoalValueWrap: { alignItems: 'flex-end' },
  reviewGoalValue: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  reviewGoalUnit: { fontSize: 11, fontWeight: '600' },
  sliderTick: { fontSize: 11, fontWeight: '500' },
  reviewActions: { flexDirection: 'row', gap: 10, marginBottom: 12, marginTop: 4 },
  reviewSecondaryBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  reviewSecondaryText: { fontSize: 13, fontWeight: '700' },
  reviewAiBtn: { flex: 1, flexDirection: 'row', paddingVertical: 13, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewAiText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  reviewStartBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  reviewStartText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  // ── Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '86%', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1 },
  modalClose: { position: 'absolute', top: 18, right: 18, padding: 6 },
  modalDay: { fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 16, letterSpacing: -0.3 },
  modalDateRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalDateNum: { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  modalDateSep: { width: 1, height: 36 },
  modalDateMonth: { fontSize: 16, fontWeight: '700' },
  modalStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, marginBottom: 22, width: '100%', justifyContent: 'center' },
  modalStatusText: { fontSize: 15, fontWeight: '600' },
  modalBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});