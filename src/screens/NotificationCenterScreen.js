import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Type → visual mapping
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  goal: {
    icon: 'checkmark-circle',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  streak: {
    icon: 'flame',
    color: '#F97316',
    bg: '#FFEDD5',
  },
  streak_milestone: {
    icon: 'trophy',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
  achievement: {
    icon: 'ribbon',
    color: '#8B5CF6',
    bg: '#EDE9FE',
  },
  water: {
    icon: 'water',
    color: '#0EA5E9',
    bg: '#E0F2FE',
  },
  sleep: {
    icon: 'moon',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  steps: {
    icon: 'footsteps',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  ai_insight: {
    icon: 'sparkles',
    color: '#EC4899',
    bg: '#FCE7F3',
  },
  system: {
    icon: 'information-circle',
    color: '#64748B',
    bg: '#F1F5F9',
  },
};

const fallbackConfig = { icon: 'notifications', color: '#64748B', bg: '#F1F5F9' };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatTimestamp(ts) {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getDateGroup(ts) {
  const now = new Date();
  const date = new Date(ts);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';
  if (date >= weekStart) return 'This week';
  return 'Earlier';
}

// ─────────────────────────────────────────────────────────────────────────────
// Single notification row
// ─────────────────────────────────────────────────────────────────────────────
function NotificationRow({ item, onPress, COLORS, FONTS, isDark }) {
  const config = TYPE_CONFIG[item.type] || fallbackConfig;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: item.read
            ? COLORS.card
            : isDark
            ? COLORS.primaryContainer
            : '#F0FDF4',
          borderLeftColor: item.read ? 'transparent' : config.color,
        },
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
    >
      {/* Type icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      {/* Text content */}
      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <Text
            style={[
              styles.rowTitle,
              FONTS.subheading,
              { color: COLORS.textPrimary, flex: 1 },
              !item.read && { fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.rowTime, { color: COLORS.textMuted }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        <Text
          style={[styles.rowBody, FONTS.smallText, { color: COLORS.textMuted }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>

      {/* Unread dot */}
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header for date grouping
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, COLORS, FONTS }) {
  return (
    <Text style={[styles.sectionHeader, FONTS.smallText, { color: COLORS.textMuted }]}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ COLORS, FONTS }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconWrap, { backgroundColor: COLORS.inputBackground }]}>
        <Ionicons name="notifications-off-outline" size={40} color={COLORS.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
        All caught up
      </Text>
      <Text style={[styles.emptyBody, FONTS.bodyText, { color: COLORS.textMuted }]}>
        Activity from goals, streaks, achievements, and AI insights will appear here.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationCenterScreen({ navigation }) {
  const themePreference = useHealthStore((s) => s.themePreference);
  const { COLORS, FONTS, isDark } = useTheme(themePreference);
  const insets = useSafeAreaInsets();

  const notificationFeed = useHealthStore((s) => s.notificationFeed) ?? [];
  const unreadNotificationCount = useHealthStore((s) => s.unreadNotificationCount) ?? 0;
  const markNotificationRead = useHealthStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useHealthStore((s) => s.markAllNotificationsRead);
  const clearNotificationFeed = useHealthStore((s) => s.clearNotificationFeed);

  // ── Group by date section ─────────────────────────────────────────────────
  const listData = useMemo(() => {
    if (!notificationFeed.length) return [];

    const groups = {};
    const groupOrder = [];

    notificationFeed.forEach((item) => {
      const group = getDateGroup(item.timestamp);
      if (!groups[group]) {
        groups[group] = [];
        groupOrder.push(group);
      }
      groups[group].push(item);
    });

    const result = [];
    groupOrder.forEach((group) => {
      result.push({ type: 'header', id: `header-${group}`, title: group });
      groups[group].forEach((item) => result.push({ type: 'item', ...item }));
    });

    return result;
  }, [notificationFeed]);

  // ── Tap handler — mark read + optional deep link ──────────────────────────
  const handlePress = useCallback(
    (item) => {
      if (!item.read) {
        markNotificationRead(item.id);
      }
      if (item.screen) {
        // Navigate to the target screen if it's registered on the navigator
        try {
          navigation.navigate(item.screen);
        } catch (_) {
          // Screen might not be directly accessible from here — ignore silently
        }
      }
    },
    [markNotificationRead, navigation]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear all notifications',
      'This will permanently remove all notification history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: clearNotificationFeed,
        },
      ]
    );
  }, [clearNotificationFeed]);

  // ── Render each item or section header ───────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === 'header') {
        return <SectionHeader title={item.title} COLORS={COLORS} FONTS={FONTS} />;
      }
      return (
        <NotificationRow
          item={item}
          onPress={handlePress}
          COLORS={COLORS}
          FONTS={FONTS}
          isDark={isDark}
        />
      );
    },
    [COLORS, FONTS, isDark, handlePress]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: COLORS.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: COLORS.border }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
            Notifications
          </Text>
          {unreadNotificationCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.headerBadgeText}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadNotificationCount > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={markAllNotificationsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark-done" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {notificationFeed.length > 0 && (
            <TouchableOpacity
              style={[styles.headerBtn, { marginLeft: 4 }]}
              onPress={handleClearAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter pills (unread shortcut) ────────────────────────────────── */}
      {notificationFeed.length > 0 && unreadNotificationCount > 0 && (
        <View style={[styles.filterRow, { borderBottomColor: COLORS.border }]}>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: COLORS.primaryContainer }]}
            onPress={markAllNotificationsRead}
          >
            <Text style={[styles.filterPillText, { color: COLORS.primary }]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
          !listData.length && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState COLORS={COLORS} FONTS={FONTS} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },

  // Filter pills
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterPillText: { fontSize: 13, fontWeight: '600' },

  // List
  listContent: { paddingTop: 8 },
  listContentEmpty: { flex: 1 },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
    marginBottom: 1,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowTime: { fontSize: 11, flexShrink: 0 },
  rowBody: { fontSize: 13, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});