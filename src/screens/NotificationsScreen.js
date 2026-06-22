import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function NotificationsScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // ── All 9 toggles + master switch now read from the persisted store ────────
  // instead of local useState that reset on every app restart.
  const notificationSettings = useHealthStore((s) => s.notificationSettings);
  const setNotificationSetting = useHealthStore((s) => s.setNotificationSetting);

  const {
    masterEnabled,
    hydration,
    stepActivity,
    sleepReminder,
    goalProgress,
    streakAlerts,
    dailyBriefing,
    aiEveningReview,
    encouragement,
    weeklyReports,
    monthlyReports,
  } = notificationSettings;

  // Reusable Toggle Component
  const ToggleRow = ({ icon, title, subtitle, value, onValueChange, iconBg, iconColor, disabled = false }) => (
    <View style={[styles.toggleRow, { borderBottomColor: COLORS.border, opacity: disabled ? 0.5 : 1 }]}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, FONTS.bodyText, { color: COLORS.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, FONTS.smallText, { color: COLORS.textMuted }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: COLORS.primary }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Master Toggle */}
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <ToggleRow
            icon="notifications"
            title="Allow Notifications"
            subtitle="Master switch for all app alerts"
            value={masterEnabled}
            onValueChange={(v) => setNotificationSetting('masterEnabled', v)}
            iconBg={isDark ? 'rgba(59, 130, 246, 0.2)' : '#EAF3FA'}
            iconColor={COLORS.primary}
          />
        </View>

        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>Daily Health Reminders</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <ToggleRow
            icon="water"
            title="Hydration Reminder"
            subtitle="Alerts every 3 hours"
            value={masterEnabled ? hydration : false}
            onValueChange={(v) => setNotificationSetting('hydration', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(6, 182, 212, 0.2)' : '#E0F7FA'}
            iconColor="#06B6D4"
          />
          <ToggleRow
            icon="footsteps"
            title="Step Activity"
            subtitle="Midday reminder to keep moving"
            value={masterEnabled ? stepActivity : false}
            onValueChange={(v) => setNotificationSetting('stepActivity', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(34, 197, 94, 0.2)' : '#E6F4EA'}
            iconColor="#10B981"
          />
          <ToggleRow
            icon="moon"
            title="Sleep Reminder"
            subtitle="Wind-down alert 30 min before bedtime"
            value={masterEnabled ? sleepReminder : false}
            onValueChange={(v) => setNotificationSetting('sleepReminder', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF'}
            iconColor="#A855F7"
          />
        </View>

        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>Milestones & Progress</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <ToggleRow
            icon="trophy"
            title="Goal Progress"
            subtitle="Alerts when you hit daily targets"
            value={masterEnabled ? goalProgress : false}
            onValueChange={(v) => setNotificationSetting('goalProgress', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7'}
            iconColor="#F59E0B"
          />
          <ToggleRow
            icon="flame"
            title="Streak Notifications"
            subtitle="Evening reminder to keep your streak alive"
            value={masterEnabled ? streakAlerts : false}
            onValueChange={(v) => setNotificationSetting('streakAlerts', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'}
            iconColor="#EF4444"
          />
        </View>

        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>AI Coach</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <ToggleRow
            icon="sunny"
            title="Daily Briefing"
            subtitle="Morning insights and goals"
            value={masterEnabled ? dailyBriefing : false}
            onValueChange={(v) => setNotificationSetting('dailyBriefing', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(249, 115, 22, 0.2)' : '#FFEDD5'}
            iconColor="#F97316"
          />
          <ToggleRow
            icon="sparkles"
            title="AI Evening Review"
            subtitle="End of day performance analysis (server-generated)"
            value={masterEnabled ? aiEveningReview : false}
            onValueChange={(v) => setNotificationSetting('aiEveningReview', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF'}
            iconColor="#6366F1"
          />
          <ToggleRow
            icon="chatbubbles"
            title="Encouragement Messages"
            subtitle="Random motivational drops"
            value={masterEnabled ? encouragement : false}
            onValueChange={(v) => setNotificationSetting('encouragement', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3'}
            iconColor="#EC4899"
          />
        </View>

        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>Reports</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000', marginBottom: 20 }]}>
          <ToggleRow
            icon="calendar"
            title="Weekly Report"
            subtitle="Sunday summary of your week"
            value={masterEnabled ? weeklyReports : false}
            onValueChange={(v) => setNotificationSetting('weeklyReports', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(100, 116, 139, 0.2)' : '#F1F5F9'}
            iconColor="#64748B"
          />
          <ToggleRow
            icon="bar-chart"
            title="Monthly Report"
            subtitle="Deep dive into your month"
            value={masterEnabled ? monthlyReports : false}
            onValueChange={(v) => setNotificationSetting('monthlyReports', v)}
            disabled={!masterEnabled}
            iconBg={isDark ? 'rgba(100, 116, 139, 0.2)' : '#F1F5F9'}
            iconColor="#64748B"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 16,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 14, marginRight: 10 },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
});