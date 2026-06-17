import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function AIHubScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);

  const aiTools = [
    {
      key: 'ingredient-detector',
      title: 'AI Ingredient Detector',
      subtitle: 'Scan food labels to analyze ingredients and uncover hidden metrics.',
      icon: 'scan-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      premium: true,
    },
    {
      key: 'calories-calculator',
      title: 'AI Calories Calculator',
      subtitle: 'Estimate nutritional value instantly from text or images.',
      icon: 'flame-outline',
      iconBg: COLORS.secondaryContainer,
      iconColor: COLORS.secondary,
      premium: true,
    },
    {
      key: 'ai-doctor',
      title: 'AI Doctor',
      subtitle: 'Get instant preliminary health insights and symptom analysis.',
      icon: 'medkit-outline',
      iconBg: COLORS.tertiaryContainer,
      iconColor: COLORS.tertiary,
      premium: true,
    },
    {
      key: 'meal-planner',
      title: 'AI Meal Planner',
      subtitle: 'Generate personalized weekly menus based on your target weight.',
      icon: 'restaurant-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      premium: true,
    },
  ];

  const shortcuts = [
    {
      key: 'ai-chat',
      title: 'HealthMate AI Assistant',
      icon: 'sparkles-outline',
    },
    {
      key: 'saved-reports',
      title: 'Saved AI Reports',
      icon: 'document-text-outline',
    },
  ];
  
  const handlePress = (key) => {
    if (key === 'ingredient-detector') return navigation.navigate('AIIngredientScreen');
    if (key === 'calories-calculator') return navigation.navigate('AICalorieScreen');
    if (key === 'ai-doctor') return navigation.navigate('AIDoctorScreen');
    if (key === 'meal-planner') return navigation.navigate('AIMealPlannerScreen');
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.heading, FONTS.mainHeading, { color: COLORS.textPrimary }]}>AI Hub</Text>
          <Text style={[styles.subheading, FONTS.bodyText, { color: COLORS.textSecondary }]}>
            Advanced artificial intelligence tools to optimize and automate your health journey.
          </Text>
        </View>

        {/* AI Tool Cards */}
        <View style={styles.toolsContainer}>
          {aiTools.map((tool) => (
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

                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Shortcuts */}
        <View style={styles.shortcutsSection}>
          <Text style={[styles.shortcutsTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
            Quick Actions
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
              onPress={() => handlePress(navigation. navigate())}
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