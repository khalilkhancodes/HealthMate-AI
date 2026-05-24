import { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getTodayDate, useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const DRINK_TYPES = [
  { key: 'water', label: 'Water', emoji: '💧', icon: 'water-outline' },
  { key: 'coffee', label: 'Coffee', emoji: '☕', icon: 'cafe-outline' },
  { key: 'juice', label: 'Juice', emoji: '🍹', icon: 'nutrition-outline' },
  { key: 'soda', label: 'Soda', emoji: '🥤', icon: 'wine-outline' },
];

export default function WaterScreen() {
  const { COLORS, FONTS, isDark } = useTheme();

  const waterGoal = useHealthStore((state) => state.waterGoalMl ?? state.waterGoal ?? 2500);
  const todaysDrinks = useHealthStore((state) => state.todaysDrinks);
  const getTotalWaterIntake = useHealthStore((state) => state.getTotalWaterIntake);
  const addWaterMl = useHealthStore((state) => state.addWaterMl);
  const setWaterGoalMl = useHealthStore((state) => state.setWaterGoalMl);

  const totalIntake = getTotalWaterIntake();
  const normalizedGoal = waterGoal && waterGoal > 0 ? waterGoal : 1;
  const cappedProgress = Math.min(totalIntake, normalizedGoal);
  const isGoalMet = !!waterGoal && totalIntake >= waterGoal;
  
  // Calculate percentage for the dynamic message
  const percentage = Math.min(Math.round((totalIntake / normalizedGoal) * 100), 100);
  const dynamicMessage = isGoalMet ? "You've reached your goal! 🎉" : `You've reached ${percentage}% of your goal!`;
  
  const sortedDrinks = useMemo(() => [...todaysDrinks].reverse(), [todaysDrinks]);

  // Color mappings to match the image precisely while supporting dark mode
  const primaryWaterDark = isDark ? COLORS.water : '#02588F'; 
  const secondaryWaterLight = isDark ? 'rgba(74, 169, 255, 0.15)' : '#EAF3FA';
  const progressTrackColor = isDark ? 'rgba(148,163,184,0.1)' : '#E0F0FF';

  // Celebration logic
  const hasCelebratedToday = useHealthStore((state) => state.hasCelebratedToday);
  const lastGoalCompletionDate = useHealthStore((state) => state.lastGoalCompletionDate);
  const setHasCelebratedToday = useHealthStore((state) => state.setHasCelebratedToday);
  const refreshDailyCelebrationState = useHealthStore((state) => state.refreshDailyCelebrationState);
  const checkAndHandleDailyReset = useHealthStore((state) => state.checkAndHandleDailyReset);
  const [showCelebration, setShowCelebration] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  useEffect(() => {
    checkAndHandleDailyReset();
  }, [checkAndHandleDailyReset]);

  useEffect(() => {
    refreshDailyCelebrationState();
    const today = getTodayDate();
    const goalCompletedToday = lastGoalCompletionDate === today;

    if (goalCompletedToday && !hasCelebratedToday) {
      setShowCelebration(true);
      setHasCelebratedToday(true);
      const t = setTimeout(() => setShowCelebration(false), 5500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hasCelebratedToday, lastGoalCompletionDate, setHasCelebratedToday, refreshDailyCelebrationState]);

  const quickAdds = [
    { label: '250ml', subtitle: 'Small glass', amount: 250, icon: 'cup-water', type: 'light' },
    { label: '500ml', subtitle: 'Large bottle', amount: 500, icon: 'glass-mug-variant', type: 'solid' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Custom Header matching the image */}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showCelebration && (
          <View pointerEvents="none" style={styles.confettiOverlay}>
            <ConfettiCannon count={140} origin={{ x: 0, y: 0 }} fadeOut autoStart />
          </View>
        )}

        {/* Top Progress Ring Section */}
        <View style={styles.progressContainer}>
          <CircularProgress
            value={cappedProgress}
            initialValue={0}
            radius={130}
            maxValue={normalizedGoal}
            activeStrokeColor={isGoalMet ? '#22C55E' : primaryWaterDark}
            inActiveStrokeColor={progressTrackColor}
            activeStrokeWidth={16}
            inActiveStrokeWidth={16}
            activeStrokeCap={'round'}
            duration={900}
            showProgressValue={false}
          />

          <View style={styles.progressCenterTextWrap}>
            <Ionicons name="water-outline" size={32} color={primaryWaterDark} style={styles.waterDropIcon} />
            <View style={styles.amountRow}>
              <Text style={[styles.progressValueText, FONTS.bigNumbers, { color: COLORS.textPrimary }]}>
                {totalIntake.toLocaleString()}
              </Text>
              <Text style={[styles.mlText, { color: COLORS.textPrimary }]}> ml</Text>
            </View>
            <Text style={[styles.progressGoalText, { color: COLORS.textMuted }]}>
              GOAL: {waterGoal.toLocaleString()} ML
            </Text>
          </View>
        </View>

        {/* Dynamic Percentage Pill */}
        <View style={styles.pillContainer}>
          <View style={[styles.messagePill, { backgroundColor: secondaryWaterLight }]}>
            <Text style={[styles.progressMessage, { color: primaryWaterDark }]}>{dynamicMessage}</Text>
          </View>
        </View>

        {/* Quick Add Section */}
        <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Quick Add</Text>
        <View style={styles.quickAddGrid}>
          {quickAdds.map((item) => {
            const isSolid = item.type === 'solid';
            const iconBgColor = isSolid 
              ? (isDark ? COLORS.water : '#60A5FA') 
              : (isDark ? 'rgba(96, 165, 250, 0.2)' : '#DBEAFE');
            const iconColor = isSolid ? '#FFFFFF' : (isDark ? '#93C5FD' : '#1E3A8A');

            return (
              <TouchableOpacity
                key={item.amount}
                style={[styles.quickAddCard, { backgroundColor: COLORS.card }]}
                activeOpacity={0.8}
                onPress={() => addWaterMl(item.amount)}
              >
                <View style={[styles.quickAddIconWrap, { backgroundColor: iconBgColor }]}>
                  <MaterialCommunityIcons name={item.icon} size={28} color={iconColor} />
                </View>
                <Text style={[styles.quickAddAmount, { color: COLORS.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.quickAddLabel, { color: COLORS.textMuted }]}>{item.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reminders Card */}
        <View style={[styles.premiumReminderCard, { backgroundColor: COLORS.card }]}>
          <View style={[styles.reminderLeft, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFEDD5' }]}>
            <Ionicons name="notifications-outline" size={24} color="#C2410C" />
          </View>
          <View style={styles.reminderBody}>
            <Text style={[styles.reminderTitle, FONTS.cardTitle, { color: COLORS.textPrimary }]}>Hydration Reminders</Text>
            <Text style={[styles.reminderSubtitle, FONTS.cardText, { color: COLORS.textMuted }]}>Every 2 hours</Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#059669' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
          />
        </View>

        {/* History Section */}
        <View style={styles.historyHeadingRow}>
          <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 0 }]}>Today's History</Text>
          <TouchableOpacity>
            <Text style={[styles.historyHeaderLabel, { color: '#059669' }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {sortedDrinks.length === 0 ? (
          <View style={[styles.emptyHistoryCard, { backgroundColor: COLORS.card }]}>
            <Text style={[styles.emptyHistoryText, FONTS.bodyText, { color: COLORS.textMuted }]}>No drinks logged yet today.</Text>
          </View>
        ) : (
          sortedDrinks.map((drink) => {
            const match = DRINK_TYPES.find((item) => item.key === drink.type);

            return (
              <View key={drink.id} style={[styles.historyCard, { backgroundColor: COLORS.card }]}>
                {/* Left side accent line */}
                <View style={[styles.historyAccent, { backgroundColor: primaryWaterDark }]} />
                
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIconWrap, { backgroundColor: secondaryWaterLight }]}>
                    <Ionicons name="time-outline" size={20} color={primaryWaterDark} />
                  </View>
                  <View style={styles.historyTextContainer}>
                    <Text style={[styles.historyType, FONTS.cardTitle, { color: COLORS.textPrimary }]}>{drink.amount} ml</Text>
                    <Text style={[styles.historyAmount, { color: COLORS.textMuted }]}>
                      {match?.label || drink.type}
                    </Text>
                  </View>
                </View>
                {/* Time pushed to the right */}
                <Text style={[styles.historyTimeText, { color: COLORS.textSecondary }]}>{drink.time}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  progressCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterDropIcon: {
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressValueText: {
    fontSize: 40,
    fontWeight: '800',
  },
  mlText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressGoalText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  pillContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  messagePill: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  progressMessage: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  quickAddCard: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  quickAddIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickAddAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  quickAddLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  premiumReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  reminderLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reminderBody: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reminderSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  historyHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historyHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHistoryCard: {
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyAccent: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  historyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyTextContainer: {
    justifyContent: 'center',
  },
  historyType: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyAmount: {
    marginTop: 4,
    fontSize: 14,
  },
  historyTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
});