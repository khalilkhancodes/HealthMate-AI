import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';

/**
 * NotificationBell
 *
 * Drop-in bell icon for any header that shows the unread count badge.
 * Navigates to NotificationCenterScreen on press.
 *
 * Usage in HomeScreen (or any screen with a navigation prop):
 *
 *   import NotificationBell from '../components/NotificationBell';
 *
 *   // Inside your header JSX:
 *   <NotificationBell navigation={navigation} color={COLORS.textPrimary} />
 */
export default function NotificationBell({ navigation, color = '#0F172A', size = 24 }) {
  const unreadNotificationCount = useHealthStore((s) => s.unreadNotificationCount) ?? 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('NotificationCenterScreen')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />

      {unreadNotificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});