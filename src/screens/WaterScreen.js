import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle, G } from 'react-native-svg';
import { getTodayDate, useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
const DRINK_TYPES = [
  { key: 'water', label: 'Water', emoji: '💧', icon: 'water-outline' },
  { key: 'coffee', label: 'Coffee', emoji: '☕', icon: 'cafe-outline' },
  { key: 'juice', label: 'Juice', emoji: '🍹', icon: 'nutrition-outline' },
  { key: 'soda', label: 'Soda', emoji: '🥤', icon: 'wine-outline' },
  { key: 'custom', label: 'Custom', emoji: '✏️', icon: 'pencil-outline' },
];
export default function WaterScreen() {
  const { COLORS, FONTS, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const waterGoal = useHealthStore((state) => state.waterGoalMl ?? state.waterGoal ?? 2500);
  const todaysDrinks = useHealthStore((state) => state.todaysDrinks);
  const getTotalWaterIntake = useHealthStore((state) => state.getTotalWaterIntake);
  const addCategorizedDrink = useHealthStore((state) => state.addCategorizedDrink);
  const isWaterReminderEnabled = useHealthStore((state) => state.isWaterReminderEnabled);
  const toggleWaterReminder = useHealthStore((state) => state.toggleWaterReminder);
  const totalIntake = getTotalWaterIntake();
  const normalizedGoal = waterGoal && waterGoal > 0 ? waterGoal : 1;
  const cappedProgress = Math.min(totalIntake, normalizedGoal);
  const isGoalMet = !!waterGoal && totalIntake >= waterGoal;
  const percentage = Math.min(Math.round((totalIntake / normalizedGoal) * 100), 100);
  const dynamicMessage = isGoalMet ? "You've reached your goal! 🎉" : `You've reached ${percentage}% of your goal!`;
  const sortedDrinks = useMemo(() => [...todaysDrinks].reverse(), [todaysDrinks]);
  const groupedDrinks = useMemo(() => {
    const by = {};
    todaysDrinks.forEach((d) => {
      const key = d.type || 'other';
      by[key] = by[key] || [];
      by[key].push(d);
    });
    return by;
  }, [todaysDrinks]);
  const primaryWaterDark = isDark ? COLORS.water : '#02588F'; 
  const secondaryWaterLight = isDark ? 'rgba(74, 169, 255, 0.15)' : '#EAF3FA';
  const progressTrackColor = isDark ? 'rgba(148,163,184,0.1)' : '#E0F0FF';
  const hasCelebratedToday = useHealthStore((state) => state.hasCelebratedToday);
  const lastGoalCompletionDate = useHealthStore((state) => state.lastGoalCompletionDate);
  const setHasCelebratedToday = useHealthStore((state) => state.setHasCelebratedToday);
  const refreshDailyCelebrationState = useHealthStore((state) => state.refreshDailyCelebrationState);
  const checkAndHandleDailyReset = useHealthStore((state) => state.checkAndHandleDailyReset);
  const [showCelebration, setShowCelebration] = useState(false);
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [selectedType, setSelectedType] = useState('water');
  const [volumeInput, setVolumeInput] = useState('250');
  const [multiplierInput, setMultiplierInput] = useState('1');
  const multipliers = {
    water: 1,
    coffee: 0.8,
    juice: 0.7,
    soda: 0.5,
    custom: 1.0,
  };
  const openSheet = (type = 'water') => {
    setSelectedType(type);
    setVolumeInput('250');
    setMultiplierInput(String(multipliers[type] ?? 1));
    setSheetVisible(true);
    Animated.timing(sheetAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSheetVisible(false));
  };
  const confirmAddFromSheet = () => {
    const raw = Number(volumeInput) || 0;
    const mult = Number(multiplierInput) || 1;
    addCategorizedDrink(selectedType, raw, mult);
    closeSheet();
  };
  const handleTypeSelect = (key) => {
    setSelectedType(key);
    if (key !== 'custom') {
      setMultiplierInput(String(multipliers[key]));
    }
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showCelebration && (
          <View pointerEvents="none" style={styles.confettiOverlay}>
            <ConfettiCannon count={140} origin={{ x: 0, y: 0 }} fadeOut autoStart />
          </View>
        )}
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
                <Text style={[styles.mlText, { color: COLORS.textPrimary }]}> ml</Text>
              </Text>
            </View>
            <Text style={[styles.progressGoalText, { color: COLORS.textMuted }]}>
              GOAL: {waterGoal.toLocaleString()} ML
            </Text>
          </View>
        </View>
        <Modal visible={sheetVisible} transparent animationType="none">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetContainer}>
            <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeSheet} />
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: COLORS.card,
                  marginBottom: Math.max(insets.bottom, 0),
                  transform: [
                    {
                      translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.sheetTitle, { color: COLORS.textPrimary }]}>Add a drink</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16 }}>
                <View style={styles.sheetRow}>
                  {DRINK_TYPES.map((d) => (
                    <TouchableOpacity key={d.key} onPress={() => handleTypeSelect(d.key)} style={[styles.sheetTypeBtn, selectedType === d.key ? { borderColor: COLORS.primary, backgroundColor: COLORS.primaryContainer } : { borderColor: COLORS.border }]}> 
                      <Text style={{ color: COLORS.textPrimary, fontWeight: selectedType === d.key ? '700' : '500' }}>{d.emoji} {d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.sheetFieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: COLORS.textMuted }]}>Volume (ml)</Text>
                  <TextInput style={[styles.sheetInput, { color: COLORS.textPrimary, borderColor: COLORS.border }]} keyboardType="numeric" value={volumeInput} onChangeText={setVolumeInput} placeholderTextColor={COLORS.textMuted} placeholder="250" />
                </View>
                <View style={{ width: 90 }}>
                  <Text style={[styles.inputLabel, { color: COLORS.textMuted }]}>Multiplier</Text>
                  <TextInput style={[styles.sheetInputSmall, { color: COLORS.textPrimary, borderColor: COLORS.border }]} keyboardType="numeric" value={multiplierInput} onChangeText={setMultiplierInput} editable={selectedType === 'custom'} placeholderTextColor={COLORS.textMuted} placeholder="1.0" />
                </View>
              </View>
              <View style={styles.sheetFooter}>
                <TouchableOpacity style={[styles.sheetCancel, { borderColor: COLORS.border }]} onPress={closeSheet}>
                  <Text style={{ color: COLORS.textPrimary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetConfirm, { backgroundColor: COLORS.primary }]} onPress={confirmAddFromSheet}>
                  <Text style={{ color: COLORS.onPrimary || '#FFFFFF', fontWeight: '700' }}>Log Drink</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
        <View style={styles.pillContainer}>
          <View style={[styles.messagePill, { backgroundColor: secondaryWaterLight }]}>
            <Text style={[styles.progressMessage, { color: primaryWaterDark }]}>{dynamicMessage}</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Quick Add</Text>
        <View style={styles.quickAddGridNew}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => addCategorizedDrink('water', 250, 1)}
            style={[styles.centralGlassWrap, { backgroundColor: COLORS.card }]}
          >
            <Ionicons name="water-outline" size={36} color={primaryWaterDark} />
            <Text style={[styles.centralGlassValue, { color: COLORS.textPrimary }]}>250 ml</Text>
            <Text style={[styles.centralGlassSubtext, { color: COLORS.textMuted }]}>Tap to log a plain glass</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openSheet('coffee')}
            style={[styles.addCard, { backgroundColor: COLORS.card }]}
          >
            <Text style={[styles.addPlus, { color: COLORS.primary }]}>+</Text>
            <Text style={[styles.addLabel, { color: COLORS.textPrimary }]}>Add Drink</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.breakdownCard, { backgroundColor: COLORS.card }]}> 
          <Text style={[styles.breakdownTitle, FONTS.cardTitle, { color: COLORS.textPrimary, marginBottom: 12 }]}>Today&apos;s Breakdown</Text>
          {useMemo(() => {
            const total = totalIntake || 0;
            const byType = {};
            todaysDrinks.forEach((d) => {
              const key = d.type || 'other';
              const net = typeof d.netHydration === 'number' ? d.netHydration : d.amount || 0;
              byType[key] = (byType[key] || 0) + net;
            });
            const entries = Object.entries(byType);
            const colors = ['#3B82F6', '#06B6D4', '#34D399', '#F97316', '#A78BFA', '#EAB308'];
            const size = 120;
            const strokeWidth = 16;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            let acc = 0;
            let percentAcc = 0; // Accumulator for exact 100% distribution
            if (entries.length === 0) {
              return <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 }}>No drinks logged yet.</Text>;
            }
            return (
              <View style={styles.breakdownInner}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}> 
                  <G rotation="-90" origin={`${size/2}, ${size/2}`}>
                    {entries.map(([key, value], idx) => {
                      const portion = total ? value / total : 0;
                      const dash = `${portion * circumference} ${circumference}`;
                      // 🛑 FIXED OFFSETS: Exact negative accumulator pushes path correctly.
                      const offset = -(acc * circumference);
                      acc += portion;
                      return (
                        <Circle
                          key={key}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={strokeWidth}
                          strokeDasharray={dash}
                          strokeDashoffset={offset}
                          fill="transparent"
                          // 🛑 REMOVED strokeLinecap="round" to prevent segments overlapping smaller slices
                        />
                      );
                    })}
                  </G>
                </Svg>
                <View style={styles.legendWrap}>
                  {entries.map(([key, value], idx) => {
                    const isLastItem = idx === entries.length - 1;
                    // 🛑 FIXED ROUNDING: Force final element to close exactly at 100%
                    let pct = total ? Math.round((value / total) * 100) : 0;
                    if (isLastItem && total > 0) {
                      pct = Math.max(0, 100 - percentAcc);
                    }
                    percentAcc += pct;
                    const labelStr = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <View key={key} style={styles.breakdownRow}>
                        <View style={[styles.legendSwatch, { backgroundColor: colors[idx % colors.length] }]} />
                        <Text style={[styles.legendLabel, { color: COLORS.textPrimary }]} numberOfLines={1}>{labelStr}</Text>
                        <Text style={[styles.legendValue, { color: COLORS.textMuted }]}>{`${value} ml • ${pct}%`}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }, [todaysDrinks, totalIntake, COLORS, FONTS])}
        </View>
        <View style={[styles.premiumReminderCard, { backgroundColor: COLORS.card }]}>
          <View style={[styles.reminderLeft, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FFEDD5' }]}>
            <Ionicons name="notifications-outline" size={24} color="#C2410C" />
          </View>
          <View style={styles.reminderBody}>
            <Text style={[styles.reminderTitle, FONTS.cardTitle, { color: COLORS.textPrimary }]}>Hydration Reminders</Text>
            <Text style={[styles.reminderSubtitle, FONTS.cardText, { color: COLORS.textMuted }]}>Every 2 hours</Text>
          </View>
          <Switch
            value={Boolean(isWaterReminderEnabled)}
            onValueChange={toggleWaterReminder}
            trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#059669' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
          />
        </View>
        <View style={styles.historyHeadingRow}>
          <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 0 }]}>Today&apos;s History</Text>
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
            const netVal = typeof drink.netHydration === 'number' ? drink.netHydration : drink.amount;
            return (
              <View key={drink.id} style={[styles.historyCard, { backgroundColor: COLORS.card }]}>
                <View style={[styles.historyAccent, { backgroundColor: primaryWaterDark }]} />
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIconWrap, { backgroundColor: secondaryWaterLight }]}>
                    <Ionicons name={match?.icon || "water-outline"} size={20} color={primaryWaterDark} />
                  </View>
                  <View style={styles.historyTextContainer}>
                    <Text style={[styles.historyType, FONTS.cardTitle, { color: COLORS.textPrimary }]}>
                      {match?.label || drink.type}
                    </Text>
                    <Text style={[styles.historyAmount, { color: COLORS.textMuted }]}>
                      Gross: {drink.amount}ml  |  Net: +{netVal}ml
                    </Text>
                  </View>
                </View>
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
    alignItems: 'center',
  },
  progressValueText: {
    fontSize: 40,
    fontWeight: '800',
  },
  mlText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 13,
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
  quickAddGridNew: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
  centralGlassWrap: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginRight: 10 },
  centralGlassValue: { fontSize: 24, fontWeight: '800', marginTop: 8 },
  centralGlassSubtext: { fontSize: 12, marginTop: 6 },
  addCard: { width: 100, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  addPlus: { fontSize: 36, fontWeight: '800' },
  addLabel: { marginTop: 6, fontSize: 13, fontWeight: '700' },
  breakdownCard: { borderRadius: 16, padding: 20, marginVertical: 12 },
  breakdownInner: { flexDirection: 'row', alignItems: 'center' },
  legendWrap: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  legendValue: { fontSize: 13 },
  sheetContainer: { flex: 1, justifyContent: 'flex-end'},
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 40, bottom: 0, left: 0, right: 0 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16},
  sheetRow: { flexDirection: 'row', gap: 8 },
  sheetTypeBtn: { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12, marginRight: 8 },
  sheetFieldRow: { flexDirection: 'row', gap: 12, marginBottom: 24, marginTop: 12, alignItems: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  sheetInput: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  sheetInputSmall: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  sheetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, marginRight: 12 },
  sheetConfirm: { flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
});