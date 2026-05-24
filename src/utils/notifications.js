import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'healthmate-alerts';
const WATER_TYPE = 'water-reminder';
const SLEEP_TYPE = 'sleep-reminder';
const MORNING_TYPE = 'morning-check-in';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'HealthMate Alerts',
      importance: Notifications.AndroidImportance.MAX,
      enableLights: true,
      lightColor: '#FF6B6B',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
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
        body: 'This is a test notification for the healthmate-alerts channel.',
        data: { type: 'test' },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('Failed to trigger test notification', err);
  }
}

export async function scheduleWaterReminders() {
  try {
    console.log('[Notifications] scheduleWaterReminders called');
    // Cancel previous water reminders we scheduled (identified by data.type)
    await cancelScheduledByType(WATER_TYPE);

    // schedule a repeating notification every 2 hours
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Time to Hydrate',
        body: 'Take a moment to drink a glass of water.',
        data: { type: WATER_TYPE },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      // ...content unchanged...
      trigger: { seconds: 2 * 60 * 60, repeats: true, channelId: CHANNEL_ID },
    });

    console.log('[Notifications] scheduleWaterReminders id ->', id);

    // persist id (optional) so we can reference it later if needed
    try {
      await AsyncStorage.setItem('@hm:waterReminderId', id);
    } catch (_e) {
      // non-fatal
    }
    return id;
  } catch (err) {
    console.warn('Failed scheduling water reminders', err);
  }
}

export async function scheduleSleepReminder(alarmTimeDate) {
  try {
    console.log('[Notifications] scheduleSleepReminder called with', alarmTimeDate);
    if (!alarmTimeDate) return null;
    const alarm = new Date(alarmTimeDate);
    if (Number.isNaN(alarm.getTime())) return null;

    // compute 8.5 hours before alarm
    const bedtime = new Date(alarm.getTime() - 8.5 * 60 * 60 * 1000);

    // cancel previous sleep reminders
    await cancelScheduledByType(SLEEP_TYPE);

    // schedule daily at computed hour/minute
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Wind Down Reminder',
        body: "Your alarm is set — it's time to start winding down for a good night's sleep.",
        data: { type: SLEEP_TYPE },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      // ...content unchanged...
      trigger: {
        hour: bedtime.getHours(),
        minute: bedtime.getMinutes(),
        repeats: true,
        channelId: CHANNEL_ID,
      },
    });

    console.log('[Notifications] scheduleSleepReminder id ->', id, 'bedtime ->', bedtime.toISOString());

    try {
      await AsyncStorage.setItem('@hm:sleepReminderId', id);
    } catch (_e) { }
    return id;
  } catch (err) {
    console.warn('Failed scheduling sleep reminder', err);
  }
}

export async function scheduleMorningCheckIn() {
  try {
    // cancel previous morning check-ins
    await cancelScheduledByType(MORNING_TYPE);
    console.log('[Notifications] scheduleMorningCheckIn called');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Morning Check-In',
        body: "Good morning! How did you sleep? Let's set today's goals.",
        data: { type: MORNING_TYPE },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: { hour: 8, minute: 0, repeats: true, channelId: CHANNEL_ID },
    });

    console.log('[Notifications] scheduleMorningCheckIn id ->', id);

    try {
      await AsyncStorage.setItem('@hm:morningCheckInId', id);
    } catch (_e) { }
    return id;
  } catch (err) {
    console.warn('Failed scheduling morning check-in', err);
  }
}

export async function cancelWaterReminders() {
  try {
    await cancelScheduledByType(WATER_TYPE);
    console.log('[Notifications] Water reminders cancelled (goal met!)');
  } catch (err) {
    console.warn('Failed cancelling water reminders', err);
  }
}

export async function cancelSleepReminder() {
  try {
    await cancelScheduledByType(SLEEP_TYPE);
    console.log('[Notifications] Sleep reminder cancelled');
  } catch (err) {
    console.warn('Failed cancelling sleep reminder', err);
  }
}

export async function cancelAllHealthmateReminders() {
  try {
    await cancelScheduledByType(WATER_TYPE);
    await cancelScheduledByType(SLEEP_TYPE);
    await cancelScheduledByType(MORNING_TYPE);
  } catch (err) {
    console.warn('Failed cancelling all reminders', err);
  }
}

// Debug helpers: trigger the sleep/morning notification immediately (for device testing)
export async function triggerSleepNow() {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Wind Down Reminder (Test)',
        body: "(Test) Time to wind down for bed.",
        data: { type: SLEEP_TYPE },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: null,
    });
    console.log('[Notifications] triggerSleepNow id ->', id);
    return id;
  } catch (err) {
    console.warn('Failed to trigger sleep now', err);
  }
}

export async function triggerMorningNow() {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Morning Check-In (Test)',
        body: "(Test) Good morning! Quick check-in.",
        data: { type: MORNING_TYPE },
        sound: 'default',
        badge: 1,
        android: { channelId: CHANNEL_ID },
      },
      trigger: null,
    });
    console.log('[Notifications] triggerMorningNow id ->', id);
    return id;
  } catch (err) {
    console.warn('Failed to trigger morning now', err);
  }
}

export default {
  requestNotificationPermissions,
  triggerTestNotification,
  scheduleWaterReminders,
  scheduleSleepReminder,
  scheduleMorningCheckIn,
  cancelAllHealthmateReminders,
  cancelWaterReminders,
  cancelSleepReminder,
};