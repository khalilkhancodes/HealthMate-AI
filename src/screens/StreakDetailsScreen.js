import Ionicons from '@expo/vector-icons/Ionicons';
import { addMonths, endOfMonth, format, getDay, isSameDay, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

/*
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const toDateString = (date) => format(date, 'yyyy-MM-dd');

const buildCalendarCells = (monthView, completionHistory, selectedDateString) => {
  const monthStart = startOfMonth(monthView);
  const monthEnd = endOfMonth(monthView);
  const leadingEmptyCells = (getDay(monthStart) + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < leadingEmptyCells; i += 1) cells.push(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dateString = toDateString(date);
    cells.push({
      date,
      dateString,
      completed: Boolean(completionHistory?.[dateString]),
      isToday: isSameDay(date, today),
      isSelected: selectedDateString === dateString,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

function CalendarDayCell({ cell, COLORS }) {
  if (!cell) return <View style={styles.calendarCell} />;

  const focused = cell.isSelected || cell.isToday;
  const completed = Boolean(cell.completed);

  return (
    <View style={styles.calendarCell}>
      <View
        style={[
          styles.calendarDay,
          {
            backgroundColor: completed ? COLORS.primary : COLORS.surface,
            borderColor: focused ? COLORS.primary : completed ? COLORS.primary : COLORS.border,
            borderWidth: focused ? 2 : 1,
          },
          focused && !completed && styles.calendarFocused,
          focused && !completed && { borderStyle: 'dotted' },
          focused && completed && { borderWidth: 0 },
        ]}
      >
        {completed ? (
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 14,
  },
  ringGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.9,
  },
  ringOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  streakDays: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  bestPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  monthNavGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  monthNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarWeekDay: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.2857%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarFocused: {
    shadowColor: '#2FBF9B',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  protectionCard: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  protectionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  protectionTitle: {
    flexShrink: 1,
  },
  protectionSnowWrap: {
    marginLeft: 8,
  },
  protectionCaption: {
    marginTop: 6,
    marginBottom: 8,
  },
  protectionBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  freezeTokens: {
    fontWeight: '800',
  },
  buyMoreBtn: {
    minWidth: 112,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyMoreText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  milestonesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  milestoneCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  milestoneIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  promoCard: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  promoGlowOne: {
    position: 'absolute',
    right: -24,
    top: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '18deg' }],
  },
  promoGlowTwo: {
    position: 'absolute',
    left: -10,
    bottom: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,183,132,0.08)',
    transform: [{ rotate: '-12deg' }],
  },
  promoTitle: {
    fontSize: 22,
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '92%',
  },
});
*/
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatAchievementDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'MMM d, yyyy');
};

const toDateString = (date) => format(date, 'yyyy-MM-dd');

const buildCalendarCells = (monthView, completionHistory) => {
  const monthStart = startOfMonth(monthView);
  const monthEnd = endOfMonth(monthView);
  const leadingEmptyCells = (getDay(monthStart) + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < leadingEmptyCells; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dateString = toDateString(date);
    cells.push({
      date,
      dateString,
      completed: Boolean(completionHistory?.[dateString]),
      isToday: isSameDay(date, today),
      isCurrentMonth: isSameMonth(date, today),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

function AchievementBadge({ item, COLORS, FONTS }) {
  const unlocked = Boolean(item.earnedDate);
  const iconBg = unlocked ? '#F59E0B' : COLORS.surface;
  const iconColor = unlocked ? '#FFFFFF' : COLORS.textMuted;
  const textColor = unlocked ? COLORS.textPrimary : COLORS.textMuted;

  return (
    <View style={styles.badgeItem}>
      <View
        style={[
          styles.badgeIconWrap,
          {
            backgroundColor: iconBg,
            opacity: unlocked ? 1 : 0.55,
          },
        ]}
      >
        <Ionicons name={item.icon} size={28} color={iconColor} />
      </View>
      <Text style={[styles.badgeTitle, FONTS.cardTitle, { color: textColor }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.badgeText, FONTS.cardText, { color: unlocked ? COLORS.primary : COLORS.textMuted }]} numberOfLines={3}>
        {unlocked ? `Earned ${formatAchievementDate(item.earnedDate)}` : item.description}
      </Text>
    </View>
  );
}

function CalendarDayCell({ cell, COLORS }) {
  if (!cell) {
    return <View style={styles.calendarCell} />;
  }

  return (
    <View style={styles.calendarCell}>
      <View
        style={[
          styles.calendarDayCircle,
          {
            backgroundColor: cell.completed ? COLORS.primary : COLORS.surface,
            borderColor: cell.isToday ? COLORS.warning : cell.completed ? COLORS.primary : COLORS.border,
            borderWidth: cell.isToday ? 2 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.calendarDayText,
            {
              color: cell.completed ? COLORS.background : COLORS.textPrimary,
              fontWeight: cell.isToday ? '800' : '600',
            },
          ]}
        >
          {cell.date.getDate()}
        </Text>
      </View>

      {cell.isToday ? <View style={[styles.todayDot, { backgroundColor: COLORS.warning }]} /> : <View style={styles.todayDotPlaceholder} />}
    </View>
  );
}

export default function StreakDetailsScreen({ navigation, route }) {
  const { COLORS, FONTS } = useTheme();
  const currentStreak = useHealthStore((state) => state.currentStreak);
  const achievements = useHealthStore((state) => state.achievements);
  const completionHistory = useHealthStore((state) => state.completionHistory || {});

  const initialMonthView = useMemo(() => {
    const routeDate = route?.params?.date ? new Date(route.params.date) : new Date();
    if (Number.isNaN(routeDate.getTime())) {
      return startOfMonth(new Date());
    }
    return startOfMonth(routeDate);
  }, [route?.params?.date]);

  const [currentMonthView, setCurrentMonthView] = useState(initialMonthView);

  useEffect(() => {
    if (route?.params?.date) {
      const routeDate = new Date(route.params.date);
      if (!Number.isNaN(routeDate.getTime())) {
        setCurrentMonthView(startOfMonth(routeDate));
      }
    }
  }, [route?.params?.date]);

  const todayMonthStart = useMemo(() => startOfMonth(new Date()), []);
  const currentViewMonthStart = startOfMonth(currentMonthView);
  const canGoNext = currentViewMonthStart.getTime() < todayMonthStart.getTime();

  const calendarCells = useMemo(
    () => buildCalendarCells(currentMonthView, completionHistory),
    [currentMonthView, completionHistory]
  );

  const goPreviousMonth = () => {
    setCurrentMonthView((prev) => startOfMonth(subMonths(prev, 1)));
  };

  const goNextMonth = () => {
    setCurrentMonthView((prev) => {
      const next = startOfMonth(addMonths(prev, 1));
      return next.getTime() <= todayMonthStart.getTime() ? next : prev;
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.75} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, FONTS.mainHeading, { color: COLORS.textPrimary }]} numberOfLines={1}>
            Streak & Achievements
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={[FONTS.bigNumbers, { color: COLORS.textPrimary }]}>{currentStreak} Days</Text>
        </View>

        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.cardHeader}>
            {/* <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Monthly Overview</Text> */}
          </View>

          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={[styles.monthNavButton, { borderColor: COLORS.border, backgroundColor: COLORS.surface }]}
              activeOpacity={0.75}
              onPress={goPreviousMonth}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.monthLabel, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
              {format(currentMonthView, 'MMMM yyyy')}
            </Text>

            <TouchableOpacity
              style={[
                styles.monthNavButton,
                {
                  borderColor: COLORS.border,
                  backgroundColor: canGoNext ? COLORS.surface : COLORS.border,
                  opacity: canGoNext ? 1 : 0.45,
                },
              ]}
              activeOpacity={0.75}
              onPress={goNextMonth}
              disabled={!canGoNext}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarHeaderRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={[styles.calendarHeaderText, FONTS.smallText, { color: COLORS.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, idx) => (
              <CalendarDayCell key={`${cell?.dateString || 'empty'}-${idx}`} cell={cell} COLORS={COLORS} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Achievements</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[FONTS.subheading, { color: COLORS.primary }]}>See all &gt;</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
            {(achievements || []).map((item) => (
              <AchievementBadge key={item.id} item={item} COLORS={COLORS} FONTS={FONTS} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  fireEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarHeaderText: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.2857%',
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  calendarDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  todayDotPlaceholder: {
    width: 6,
    height: 6,
    marginTop: 5,
  },
  badgeRow: {
    paddingTop: 4,
    paddingRight: 4,
    gap: 14,
  },
  badgeItem: {
    width: 124,
    marginRight: 2,
  },
  badgeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeTitle: {
    marginBottom: 4,
  },
  badgeText: {
    lineHeight: 17,
  },
});
