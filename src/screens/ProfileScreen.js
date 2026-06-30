import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : insets.top + 20;
  const { COLORS, FONTS, isDark, themePreference, setThemePreference } = useTheme();

  const { isSignedIn, signOut } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();

  const {
    isPremiumUser, user, setUser, isGuestMode, clearGuestMode,
    userWakeTime, userBedTime, updateBiologicalSchedule, requiresTimezoneUpdate
  } = useHealthStore();
  const userAvatar = useHealthStore((state) => state.userAvatar);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [tempWakeH, setTempWakeH] = useState(parseInt(userWakeTime.split(':')[0]));
  const [tempWakeM, setTempWakeM] = useState(parseInt(userWakeTime.split(':')[1]));
  const [tempBedH, setTempBedH] = useState(parseInt(userBedTime.split(':')[0]));
  const [tempBedM, setTempBedM] = useState(parseInt(userBedTime.split(':')[1]));

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        name: clerkUser.firstName + ' ' + clerkUser.lastName || clerkUser.username || 'User',
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        avatar: clerkUser.profileImageUrl || '',
      });
    }
  }, [isLoaded, clerkUser, setUser]);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';

  const handleLogout = async () => {
    try {
      if (isSignedIn) await signOut();
      clearGuestMode();
    } catch (err) { console.error('Logout error:', err); }
  };

  const themeOptions = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  const MenuRow = ({ icon, title, subtitle, showArrow = true, rightElement, onPress, iconBg = '#E6F4FE', iconColor = COLORS.primary }) => (
    <TouchableOpacity style={[styles.menuRow, { borderBottomColor: COLORS.border }]} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
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

  const saveBiologicalSchedule = (isTimezoneFix = false) => {
    const wFormat = `${String(tempWakeH).padStart(2, '0')}:${String(tempWakeM).padStart(2, '0')}`;
    const bFormat = `${String(tempBedH).padStart(2, '0')}:${String(tempBedM).padStart(2, '0')}`;

    const result = updateBiologicalSchedule(wFormat, bFormat, isTimezoneFix);

    if (result.success) {
      setShowScheduleModal(false);
      if (isTimezoneFix) Alert.alert("Timezone Calibrated", "Your biological schedule has been synced to local time.");
    } else {
      Alert.alert("Schedule Locked", result.message);
      setShowScheduleModal(false);
    }
  };

  const formatTimeUI = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: safeTopPadding }]} showsVerticalScrollIndicator={false}>

        {/* TIMEZONE DRIFT BANNER */}
        {requiresTimezoneUpdate && (
          <View style={[styles.timezoneBanner, { backgroundColor: '#FEF2F2', borderColor: '#F87171' }]}>
            <Ionicons name="earth" size={24} color="#DC2626" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[FONTS.bodyText, { color: '#991B1B', fontWeight: '700' }]}>Timezone Change Detected</Text>
              <Text style={[FONTS.smallText, { color: '#B91C1C', marginTop: 2 }]}>Recalibrate your Wake/Sleep schedule to match your local time to maintain accurate analytics.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowScheduleModal(true)} style={{ backgroundColor: '#DC2626', padding: 8, borderRadius: 8 }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Fix Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          {!isSignedIn ? (
            <View style={styles.guestHeader}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#293341' : '#E2E8F0' }]}>
                <Ionicons name="person" size={32} color="#94A3B8" />
              </View>
              <View style={styles.headerTextLayout}>
                <Text style={[styles.headerName, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Personalize your app</Text>
                <Text style={[styles.headerSubtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Sign in to save your health data</Text>
              </View>
            </View>
          ) : (
            <View style={styles.userHeader}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#1D2C3A' : '#E6F4FE', overflow: 'hidden' }]}>
                {userAvatar || clerkUser?.imageUrl ? (
                  <Image source={userAvatar ? (userAvatar.uri ? { uri: userAvatar.uri } : userAvatar) : { uri: clerkUser.imageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarInitials, { color: COLORS.primary }]}>{displayName.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.headerTextLayout}>
                <Text style={[styles.headerName, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>{displayName}</Text>
                <Text style={[styles.headerSubtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>{displayEmail}</Text>
              </View>
            </View>
          )}

          {!isSignedIn && (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('LoginNavigator')}>
              <Text style={[styles.primaryButtonText, { color: COLORS.card }]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
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

        <Text style={[styles.sectionTitle, FONTS.bodyText, { color: COLORS.textMuted }]}>App Preferences</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, paddingVertical: 8, shadowColor: isDark ? COLORS.background : '#000000' }]}>

          <MenuRow
            icon="time-outline"
            title="Biological Schedule"
            subtitle={`Wake: ${formatTimeUI(...userWakeTime.split(':').map(Number))} • Bed: ${formatTimeUI(...userBedTime.split(':').map(Number))}`}
            iconBg="#F3E8FF"
            iconColor="#8B5CF6"
            onPress={() => setShowScheduleModal(true)}
          />

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
                  <TouchableOpacity key={option.key} activeOpacity={0.9} onPress={() => setThemePreference(option.key)} style={[styles.themeOption, { backgroundColor: isActive ? COLORS.primary : 'transparent', borderColor: isActive ? COLORS.primary : 'transparent' }]}>
                    <Ionicons name={option.icon} size={16} color={isActive ? '#FFFFFF' : COLORS.textMuted} />
                    <Text style={[styles.themeOptionText, { color: isActive ? '#FFFFFF' : COLORS.textSecondary }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <MenuRow icon="notifications" title="Notifications" subtitle="Reminders and alerts" iconBg="#FFF3E6" iconColor="#F97316" onPress={() => navigation.navigate('NotificationsScreen')} />
        </View>

        <Text style={[styles.sectionTitle, FONTS.smallText, { color: COLORS.textMuted }]}>Support & About</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, paddingVertical: 8, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <MenuRow icon="help-buoy" title="Help Center" subtitle="Articles and guides" iconBg="#EAF8F0" iconColor="#10B981" onPress={() => navigation.navigate('HelpScreen')} />
          <MenuRow icon="shield-checkmark" title="Privacy Policy" subtitle="How your data is protected" iconBg="#E2E8F0" iconColor="#64748B" onPress={() => navigation.navigate('PrivacyPolicyScreen')} />
          <MenuRow icon="information-circle" title="App Version" subtitle="v1.0.0" iconBg="#E2E8F0" iconColor="#64748B" showArrow={false} />
        </View>

        {isSignedIn && (
          <TouchableOpacity style={[styles.logoutButton, { borderColor: COLORS.border, backgroundColor: COLORS.primary }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.card} />
            <Text style={[styles.logoutText, FONTS.bodyText, { color: COLORS.card }]}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* SCHEDULE SETTINGS MODAL */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
            <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 8 }]}>Biological Schedule</Text>
            <Text style={[FONTS.smallText, { color: COLORS.textMuted, marginBottom: 24 }]}>Setting this accurately ensures notifications and daily resets trigger correctly for your timezone and shifts.</Text>

            <View style={styles.timeSection}>
              <Text style={[FONTS.bodyText, { color: COLORS.textPrimary, fontWeight: '700', flex: 1 }]}>Target Wake Time</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity onPress={() => setTempWakeH(prev => (prev === 23 ? 0 : prev + 1))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>+</Text></TouchableOpacity>
                <Text style={[FONTS.sectionHeading, { color: COLORS.primary, width: 40, textAlign: 'center' }]}>{String(tempWakeH).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempWakeH(prev => (prev === 0 ? 23 : prev - 1))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>-</Text></TouchableOpacity>
              </View>
              <Text style={{ marginHorizontal: 8, fontSize: 20, color: COLORS.textMuted }}>:</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity onPress={() => setTempWakeM(prev => (prev >= 45 ? 0 : prev + 15))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>+</Text></TouchableOpacity>
                <Text style={[FONTS.sectionHeading, { color: COLORS.primary, width: 40, textAlign: 'center' }]}>{String(tempWakeM).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempWakeM(prev => (prev === 0 ? 45 : prev - 15))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>-</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.timeSection}>
              <Text style={[FONTS.bodyText, { color: COLORS.textPrimary, fontWeight: '700', flex: 1 }]}>Target Bed Time</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity onPress={() => setTempBedH(prev => (prev === 23 ? 0 : prev + 1))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>+</Text></TouchableOpacity>
                <Text style={[FONTS.sectionHeading, { color: COLORS.primary, width: 40, textAlign: 'center' }]}>{String(tempBedH).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempBedH(prev => (prev === 0 ? 23 : prev - 1))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>-</Text></TouchableOpacity>
              </View>
              <Text style={{ marginHorizontal: 8, fontSize: 20, color: COLORS.textMuted }}>:</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity onPress={() => setTempBedM(prev => (prev >= 45 ? 0 : prev + 15))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>+</Text></TouchableOpacity>
                <Text style={[FONTS.sectionHeading, { color: COLORS.primary, width: 40, textAlign: 'center' }]}>{String(tempBedM).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setTempBedM(prev => (prev === 0 ? 45 : prev - 15))} style={styles.timeBtn}><Text style={styles.timeBtnTxt}>-</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)} style={[styles.modalBtn, { backgroundColor: COLORS.surface }]}>
                <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => saveBiologicalSchedule(requiresTimezoneUpdate)} style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}>
                <Text style={{ color: COLORS.card, fontWeight: '700' }}>{requiresTimezoneUpdate ? "Calibrate Now" : "Save Schedule"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { borderRadius: 16, padding: 16, marginBottom: 24, elevation: 2 },
  timezoneBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  guestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 24, fontWeight: '700' },
  headerTextLayout: { marginLeft: 16, flex: 1 },
  headerName: { fontSize: 18, fontWeight: '700', marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  headerSubtitle: { fontSize: 14 },
  primaryButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 20, marginBottom: 24 },
  bannerTextContainer: { flex: 1, paddingRight: 12 },
  bannerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  bannerSubtitle: { fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: 14 },
  menuTitle: { fontSize: 16, fontWeight: '500' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  themeControlWrap: { paddingHorizontal: 2, paddingVertical: 10 },
  themeSegmentedControl: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 6 },
  themeOption: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1 },
  themeOptionText: { fontSize: 13, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  logoutText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%' },
  timeSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timeControls: { alignItems: 'center' },
  timeBtn: { paddingHorizontal: 16, paddingVertical: 4, backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 8 },
  timeBtnTxt: { fontSize: 18, fontWeight: '700', color: '#888' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 }
});