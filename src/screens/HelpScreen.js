import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

export default function HelpScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : insets.top + 20;

  const helpCards = [
    {
      key: 'getting-started',
      icon: 'rocket-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      title: 'Getting Started',
      subtitle: 'Set up your profile, connect devices, and start tracking.',
      articles: '12 Articles',
      onPress: () => {},
    },
    {
      key: 'my-data',
      icon: 'server-outline',
      iconBg: COLORS.secondaryContainer,
      iconColor: COLORS.secondary,
      title: 'My Data',
      subtitle: 'Learn how to export data and manage your privacy settings.',
      articles: '8 Articles',
      onPress: () => navigation.navigate('PrivacyPolicyScreen'),
    },
    {
      key: 'tools-tracking',
      icon: 'build-outline',
      iconBg: COLORS.tertiaryContainer,
      iconColor: COLORS.tertiary,
      title: 'Tools & Tracking',
      subtitle: 'BMI, BMR, hydration, steps, sleep, and AI tool guidance.',
      articles: '10 Articles',
      onPress: () => navigation.navigate('Tools'),
    },
    {
      key: 'premium-billing',
      icon: 'card-outline',
      iconBg: COLORS.primaryContainer,
      iconColor: COLORS.primary,
      title: 'Premium & Billing',
      subtitle: 'Manage plans, trial, purchases, and restore your subscription.',
      articles: '6 Articles',
      onPress: () => navigation.navigate('PaywallScreen'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: safeTopPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: COLORS.primaryContainer }]}> 
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.brandText, FONTS.sectionHeading, { color: COLORS.primary }]}>HealthMate AI</Text>
          </View>

          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>How can we help?</Text>

        <View style={[styles.searchBar, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}> 
          <Ionicons name="search-outline" size={28} color={COLORS.textMuted} />
          <Text style={[styles.searchText, FONTS.bodyText, { color: COLORS.textMuted }]}>Search for articles, guides...</Text>
        </View>

        <View style={styles.cardsWrap}>
          {helpCards.map((card) => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={0.9}
              onPress={card.onPress}
              style={[styles.helpCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.textPrimary, shadowOpacity: isDark ? 0.22 : 0.06 }]}
            >
              <View style={[styles.cardIcon, { backgroundColor: card.iconBg }]}>
                <Ionicons name={card.icon} size={26} color={card.iconColor} />
              </View>
              <Text style={[styles.cardTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>{card.title}</Text>
              <Text style={[styles.cardSubtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>{card.subtitle}</Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.articleText, FONTS.subheading, { color: card.iconColor }]}>{card.articles}</Text>
                <Ionicons name="chevron-forward" size={20} color={card.iconColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 110 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '70%'},
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 40 / 2, fontWeight: '800' },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
      marginLeft: 'auto',
  },
  title: {
    textAlign: 'center',
    fontSize: 52 / 2,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 84 / 2,
    marginBottom: 20,
    gap: 10,
  },
  searchText: { fontSize: 18 / 1.15 },
  cardsWrap: { gap: 14 },
  helpCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardIcon: {
    width: 72 / 1.35,
    height: 72 / 1.35,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22 / 1.1,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  articleText: {
    fontSize: 18 / 1.1,
    fontWeight: '700',
  },
});
