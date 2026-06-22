import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
export default function ToolsMenuScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);
  const tools = [
    {
      key: 'bmi',
      title: 'BMI Calculator',
      subtitle: 'Body Mass Index calculation based on height and weight.',
      icon: 'calculator-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
    },
    {
      key: 'bmr-recalculate',
      title: 'BMR Calculator',
      subtitle: 'Estimate daily calories from your profile and activity.',
      icon: 'flame-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      // premium: true,
    },
    {
      key: 'hydration',
      title: 'Hydration',
      subtitle: '4 glasses to go',
      icon: 'water-outline',
      iconBg: COLORS.secondaryContainer,
      iconColor: COLORS.secondary,
      showMetric: true,
      metric: '1.2L',
      metricSubtext: '/ 2.5L',
    },
    {
      key: 'steps',
      title: 'Step Counter',
      subtitle: 'Track your activity throughout the day.',
      icon: 'footsteps-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      showMetric: true,
      metric: '6,432',
      metricSubtext: 'today',
    },
    {
      key: 'sleep',
      title: 'Sleep Tracker',
      subtitle: 'Track sleep sessions, alarm goals, and weekly recovery trends.',
      icon: 'moon-outline',
      iconBg: COLORS.tertiaryContainer,
      iconColor: COLORS.tertiary,
      showMetric: true,
      metric: '7h 20m',
      metricSubtext: 'Last Night',
      // premium: true,
    },
  ];
  const shortcuts = [
    {
      key: 'heart-rate',
      title: 'Heart Rate History',
      icon: 'heart-outline',
    },
    {
      key: 'nutrition',
      title: 'Nutrition Log',
      icon: 'restaurant-outline',
    },
  ];
  const handlePress = (key) => {
    if (key === 'bmi') return navigation.navigate('BMIScreen');
    if (key === 'bmr-recalculate') return navigation.navigate('BMRScreen');
    if (key === 'hydration') return navigation.navigate('WaterScreen');
    if (key === 'sleep') return navigation.navigate('SleepScreen');
    if (key === 'steps') return navigation.navigate('StepScreen');
    console.log(`${key} tool is coming soon`);
  };
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.heading, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Health Tools</Text>
          <Text style={[styles.subheading, FONTS.bodyText, { color: COLORS.textSecondary }]}>Precision calculations and tracking to help you maintain your momentum.</Text>
        </View>
        {/* Tool Cards */}
        <View style={styles.toolsContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.key}
              style={[
                styles.toolCard,
                {
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOpacity: isDark ? 0.3 : 0.06,
                },
              ]}
              activeOpacity={0.9}
              onPress={() => handlePress(tool.key)}
            >
              <View style={styles.toolCardContent}>
                <View style={styles.toolLeftSection}>
                  <View style={[styles.toolIcon, { backgroundColor: tool.iconBg }]}>
                    <Ionicons name={tool.icon} size={24} color={tool.iconColor} />
                  </View>
                  <View style={styles.toolTextSection}>
                    <Text style={[styles.toolTitle, FONTS.cardTitle, { color: COLORS.textPrimary }]}>
                      {tool.title}
                    </Text>
                    <Text style={[styles.toolSubtitle, FONTS.cardText, { color: COLORS.textSecondary }]}>
                      {tool.subtitle}
                    </Text>
                  </View>
                </View>
                {tool.premium && !isPremiumUser && (
                  <View style={[styles.premiumPill, { backgroundColor: isDark ? '#2A2A2A' : '#EEF2F7' }]}>
                    <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                    <Text style={[styles.premiumPillText, { color: COLORS.textSecondary }]}>Pro</Text>
                  </View>
                )}
                {tool.showMetric && (
                  <View style={styles.toolRightSection}>
                    <Text style={[styles.toolMetric, { color: COLORS.textPrimary }]}>
                      {tool.metric}
                    </Text>
                    <Text style={[styles.toolMetricSubtext, FONTS.smallText, { color: COLORS.textSecondary }]}>
                      {tool.metricSubtext}
                    </Text>
                  </View>
                )}
                {!tool.showMetric && (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                )}
              </View>
              {/* Progress bar for BMI */}
              {tool.key === 'bmi' && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: COLORS.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: COLORS.primary, width: '60%' }]} />
                  </View>
                  <Text style={[styles.progressText, { color: COLORS.primary }]}>
                    22.4 (Normal)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {/* Quick Shortcuts */}
        <View style={styles.shortcutsSection}>
          <Text style={[styles.shortcutsTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
            Quick Shortcuts
          </Text>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.key}
              style={[
                styles.shortcutItem,
                {
                  borderBottomColor: COLORS.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handlePress(shortcut.key)}
            >
              <View style={styles.shortcutLeft}>
                <Ionicons name={shortcut.icon} size={24} color={COLORS.textPrimary} />
                <Text style={[styles.shortcutText, FONTS.bodyText, { color: COLORS.textPrimary }]}>
                  {shortcut.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
  },
  toolsContainer: {
    marginBottom: 32,
    gap: 8,
  },
  toolCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  toolCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolTextSection: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  toolRightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  premiumPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  premiumPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toolMetric: {
    fontSize: 18,
    fontWeight: '700',
  },
  toolMetricSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shortcutsSection: {
    marginTop: 24,
  },
  shortcutsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  shortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutText: {
    fontSize: 15,
    fontWeight: '500',
  },
});