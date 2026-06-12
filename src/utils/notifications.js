import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 🛑 FIX 1: Rename the channel to force Android to create a fresh, un-muted pipeline
const CHANNEL_ID = 'healthmate-alerts-v2';
const WATER_TYPE = 'water-reminder';
const MORNING_TYPE = 'morning-check-in';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('--- NATIVE HANDLER INTERCEPTED NOTIFICATION ---');
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'HealthMate Alerts V2',
      importance: Notifications.AndroidImportance.MAX,
      enableLights: true,
      lightColor: '#FF6B6B',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      // Removed sound string here so OS uses its native default alarm sound
    });
    console.log('Successfully registered fresh channel:', CHANNEL_ID);
  } catch (err) {
    console.warn('Failed creating Android channel', err);
  }
}

async function cancelScheduledByType(type) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const matches = scheduled.filter((s) => s?.content?.data?.type === type);
    await Promise.all(matches.map((m) => Notifications.cancelScheduledNotificationAsync(m.identifier)));
  } catch (err) {
    console.warn('Error cancelling scheduled notifications by type', type, err);
  }
}

export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.warn('Notifications: physical device required for push notifications.');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notifications permission not granted.');
    return false;
  }

  if (Platform.OS === 'android') {
    await ensureAndroidChannel();
  }

  return true;
}

export async function triggerTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test: HealthMate Notification',
        body: 'This is a test notification for the new V2 channel.',
        data: { type: 'test' },
        sound: true, // 🛑 FIX 2: Must be boolean true
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: null, // Fires instantly
    });
  } catch (err) {
    console.warn('Failed to trigger test notification', err);
  }
}

export async function scheduleWaterReminders() {
  try {
    console.log('[Notifications] scheduleWaterReminders called');
    await cancelScheduledByType(WATER_TYPE);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Time to Hydrate',
        body: 'Take a moment to drink a glass of water.',
        data: { type: WATER_TYPE },
        sound: true,
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: { seconds: 2 * 60 * 60, repeats: true, channelId: CHANNEL_ID },
    });
    return id;
  } catch (err) {
    console.warn('Failed scheduling water reminders', err);
  }
}

export async function scheduleMorningCheckIn() {
  try {
    await cancelScheduledByType(MORNING_TYPE);
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Morning Check-In',
        body: "Good morning! How did you sleep? Let's set today's goals.",
        data: { type: MORNING_TYPE },
        sound: true,
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: { hour: 8, minute: 0, repeats: true, channelId: CHANNEL_ID },
    });
    return id;
  } catch (err) {
    console.warn('Failed scheduling morning check-in', err);
  }
}

export async function cancelWaterReminders() {
  await cancelScheduledByType(WATER_TYPE);
}

export async function cancelMorningCheckIn() {
  await cancelScheduledByType(MORNING_TYPE);
}

export async function cancelAllHealthmateReminders() {
  await cancelScheduledByType(WATER_TYPE);
  await cancelScheduledByType(MORNING_TYPE);
}

export async function triggerMorningNow() {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Morning Check-In (Test)',
        body: "(Test) Good morning! Quick check-in.",
        data: { type: MORNING_TYPE },
        sound: true,
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: null,
    });
    return id;
  } catch (_err) { }
}

export default {
  requestNotificationPermissions,
  triggerTestNotification,
  scheduleWaterReminders,
  scheduleMorningCheckIn,
  cancelAllHealthmateReminders,
  cancelWaterReminders,
  cancelMorningCheckIn,
};