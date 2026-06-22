import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
function Bullet({ COLORS, FONTS, title, subtitle }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletIcon, { borderColor: COLORS.primary }]}> 
        <Ionicons name="checkmark" size={14} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bulletTitle, FONTS.subheading, { color: COLORS.textPrimary }]}>{title}</Text>
        <Text style={[styles.bulletSubtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}
export default function PrivacyPolicyScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : insets.top + 20;
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: safeTopPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={30} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={[styles.brandText, FONTS.sectionHeading, { color: COLORS.primary }]}>HealthMate AI</Text>
          <View style={[styles.bookCircle, { backgroundColor: isDark ? '#27475A' : '#2E5870' }]}>
            <Ionicons name="book-outline" size={20} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.heroWrap}>
          <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Privacy Policy</Text>
          <Text style={[styles.subtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>Last updated: October 24, 2023. Your trust is our priority.</Text>
        </View>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.textPrimary }]}>
          <View style={styles.rowTop}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primaryContainer }]}>
              <Ionicons name="shield-half-outline" size={34} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardHeading, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Our Commitment</Text>
              <Text style={[styles.cardBodyText, FONTS.bodyText, { color: COLORS.textSecondary }]}>
                {`HealthMate is designed with your privacy in mind. We do not sell your personal health data to third parties. Every feature we build starts with the question: "How can we protect the user?"`}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, shadowColor: COLORS.textPrimary }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="grid-outline" size={26} color={COLORS.secondary} />
            <Text style={[styles.sectionHeaderTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Information We Collect</Text>
          </View>
          <Text style={[styles.sectionIntro, FONTS.bodyText, { color: COLORS.textSecondary }]}>To provide you with personalized health insights, we collect the following types of information:</Text>
          <Bullet
            COLORS={COLORS}
            FONTS={FONTS}
            title="Health & Fitness Data"
            subtitle="Steps, heart rate, sleep patterns, and workout history synced from your devices."
          />
          <Bullet
            COLORS={COLORS}
            FONTS={FONTS}
            title="Personal Information"
            subtitle="Name, email address, age, and biological sex for accurate health metrics."
          />
          <Bullet
            COLORS={COLORS}
            FONTS={FONTS}
            title="Device & App Usage"
            subtitle="App diagnostics, crash logs, and feature usage to improve app stability and quality."
          />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 38 / 2,
    fontWeight: '800',
    marginLeft: 8,
    flex: 1,
  },
  bookCircle: {
    width: 40,
    height: 40,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    textAlign: 'center',
    fontSize: 54 / 2,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    gap: 14,
  },
  iconBox: {
    width: 72 / 1.2,
    height: 72 / 1.2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 21 / 1.1,
    marginBottom: 8,
  },
  cardBodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 22 / 1.1,
    flex: 1,
  },
  sectionIntro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bulletIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  bulletTitle: {
    fontSize: 17,
    marginBottom: 2,
  },
  bulletSubtitle: {
    fontSize: 15,
    lineHeight: 24,
  },
});
