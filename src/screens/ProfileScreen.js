import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : insets.top + 20;
  const { COLORS, FONTS, isDark, themePreference } = useTheme();
  // Clerk hooks for authentication and user data
  const { isSignedIn, signOut } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();
  // Zustand store
  const { isPremiumUser, user, setUser, isGuestMode, clearGuestMode, setThemePreference } = useHealthStore();
  // Sync Clerk user data into Zustand when user loads
  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        name: clerkUser.firstName || clerkUser.username || 'User',
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        avatar: clerkUser.profileImageUrl || '',
      });
    }
  }, [isLoaded, clerkUser, setUser]);
  // Mock User Data (fallback)
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  // Handle logout: Clerk signOut + clear guest mode
  const handleLogout = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }
      clearGuestMode();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  const themeOptions = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];
  // --- REUSABLE UI COMPONENTS ---
  const MenuRow = ({ icon, title, subtitle, showArrow = true, rightElement, onPress, iconBg = '#E6F4FE', iconColor = COLORS.primary }) => (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: COLORS.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, FONTS.bodyText, { color: COLORS.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, FONTS.smallText, { color: COLORS.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : (showArrow && <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />)}
    </TouchableOpacity>
  );
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: safeTopPadding }]} showsVerticalScrollIndicator={false}>
        {/* --- DYNAMIC HEADER CARD --- */}
        {!isSignedIn ? (
          // NOT SIGNED IN (INCLUDING GUEST MODE)
          <View
            style={[
              styles.card,
              {
                backgroundColor: COLORS.card,
                shadowColor: isDark
                  ? COLORS.background
                  : '#000000',
              },
            ]}
          >
            <View style={styles.guestHeader}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: isDark
                      ? '#293341'
                      : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={32}
                  color="#94A3B8"
                />
              </View>
              <View style={styles.headerTextLayout}>
                <Text
                  style={[
                    styles.headerName,
                    FONTS.sectionHeading,
                    { color: COLORS.textPrimary },
                  ]}
                >
                  Personalize your app
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    FONTS.bodyText,
                    { color: COLORS.textMuted },
                  ]}
                >
                  Sign in to save your health data
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: COLORS.primary },
              ]}
              onPress={() => {
                navigation.navigate('LoginNavigator');
              }}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: COLORS.card },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // SIGNED IN USER
          <View
            style={[
              styles.card,
              {
                backgroundColor: COLORS.card,
                shadowColor: isDark
                  ? COLORS.background
                  : '#000000',
              },
            ]}
          >
            <View style={styles.userHeader}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: isDark
                      ? '#1D2C3A'
                      : '#E6F4FE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: COLORS.primary },
                  ]}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerTextLayout}>
                <Text
                  style={[
                    styles.headerName,
                    FONTS.sectionHeading,
                    { color: COLORS.textPrimary },
                  ]}
                >
                  {displayName}
                  {isPremiumUser && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    FONTS.bodyText,
                    { color: COLORS.textMuted },
                  ]}
                >
                  {displayEmail}
                </Text>
              </View>
            </View>
          </View>
        )}
        {/* --- UPGRADE BANNER (Logged In or Guest, Not Premium) --- */}
        {(isSignedIn || isGuestMode) && !isPremiumUser && (
          <TouchableOpacity
            style={[styles.upgradeBanner, { backgroundColor: COLORS.primary, shadowColor: isDark ? COLORS.background : '#000000' }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PaywallScreen')}
          >
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, FONTS.sectionHeading, { color: COLORS.card }]}>Upgrade to Premium</Text>
              <Text style={[styles.bannerSubtitle, FONTS.bodyText, { color: 'rgba(255, 255, 255, 0.9)' }]}>Unlock AI Analytics & AI Health Coaching</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {/* --- SETTINGS GROUP 1: PREFERENCES --- */}
        <Text style={[styles.sectionTitle, FONTS.bodyText, { color: COLORS.textMuted }]}>App Preferences</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, paddingVertical: 8, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <View style={[styles.menuRow, { borderBottomColor: COLORS.border }]}>
            <View style={[styles.menuIcon, { backgroundColor: '#EAF8F0' }]}>
              <Ionicons name="color-palette-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, FONTS.bodyText, { color: COLORS.textPrimary }]}>Theme</Text>
              <Text style={[styles.menuSubtitle, FONTS.smallText, { color: COLORS.textMuted }]}>Light, dark, or follow system setting</Text>
            </View>
          </View>
          <View style={styles.themeControlWrap}>
            <View style={[styles.themeSegmentedControl, { backgroundColor: isDark ? '#2E2E2E' : '#F3F4F6', borderColor: COLORS.border }]}>
              {themeOptions.map((option) => {
                const isActive = themePreference === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.9}
                    onPress={() => setThemePreference(option.key)}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: isActive ? COLORS.primary : 'transparent',
                        borderColor: isActive ? COLORS.primary : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={16}
                      color={isActive ? '#FFFFFF' : COLORS.textMuted}
                    />
                    <Text style={[styles.themeOptionText, { color: isActive ? '#FFFFFF' : COLORS.textSecondary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <MenuRow
            icon="notifications"
            title="Notifications"
            subtitle="Reminders and alerts"
            iconBg="#FFF3E6"
            iconColor="#F97316"
            onPress={() => navigation.navigate('NotificationsScreen')}
          />
        </View>
        {/* --- SETTINGS GROUP 2: SUPPORT --- */}
        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>Support & About</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, paddingVertical: 8, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <MenuRow icon="help-buoy" title="Help Center" subtitle="Articles and guides" iconBg="#EAF8F0" iconColor="#10B981" onPress={() => navigation.navigate('HelpScreen')} />
          <MenuRow icon="shield-checkmark" title="Privacy Policy" subtitle="How your data is protected" iconBg="#E2E8F0" iconColor="#64748B" onPress={() => navigation.navigate('PrivacyPolicyScreen')} />
          <MenuRow icon="information-circle" title="App Version" subtitle="v1.0.0" iconBg="#E2E8F0" iconColor="#64748B" showArrow={false} />
        </View>
        {/* --- LOGOUT BUTTON (Logged In or Guest) --- */}
        {isSignedIn && (
          <TouchableOpacity style={[styles.logoutButton, { borderColor: COLORS.border, backgroundColor: COLORS.primary }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.card} />
            <Text style={[styles.logoutText, FONTS.bodyText, { color: COLORS.card }]}>Log Out</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerTextLayout: {
    marginLeft: 16,
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeControlWrap: {
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  themeSegmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  themeOption: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});