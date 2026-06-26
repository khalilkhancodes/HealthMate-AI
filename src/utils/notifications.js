import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

const CHANNEL_ID = 'healthmate-alerts';
let handlerInstalled = false;

function ensureNotificationHandler() {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerInstalled = true;
}

const CATEGORY = {
  WATER: 'water-reminder',
  MORNING: 'morning-checkin',
  STEP: 'step-activity',
  SLEEP: 'sleep-winddown',
  STREAK: 'streak-risk',
  GOAL: 'goal-progress',
};

async function configurePushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'HealthMate Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5BB5EB',
    });
  }
}

export async function requestNotificationPermissions() {
  ensureNotificationHandler();
  if (!Device.isDevice) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;
  await configurePushNotifications();
  return true;
}

async function cancelByCategory(category) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((n) => n.content?.data?.category === category);
  await Promise.all(matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleWaterReminders() {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.WATER);
  await Notifications.scheduleNotificationAsync({
    content: { title: '💧 Time to hydrate', body: "It's been a few hours — grab some water to stay on track.", sound: true, data: { category: CATEGORY.WATER } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3*60*60, repeats: true, channelId: CHANNEL_ID },
  });
}

export async function cancelWaterReminders() { await cancelByCategory(CATEGORY.WATER); }

export async function scheduleMorningCheckIn(hour = 8, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.MORNING);
  await Notifications.scheduleNotificationAsync({
    content: { title: '☀️ Good morning!', body: "Here's your daily briefing — check today's goals.", sound: true, data: { category: CATEGORY.MORNING } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}

export async function cancelMorningCheckIn() { await cancelByCategory(CATEGORY.MORNING); }

export async function scheduleStepActivityReminder(hour = 14, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.STEP);
  await Notifications.scheduleNotificationAsync({
    content: { title: '🏃 Keep moving', body: "You're halfway through the day — close the gap to your step goal.", sound: true, data: { category: CATEGORY.STEP } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}

export async function cancelStepActivityReminder() { await cancelByCategory(CATEGORY.STEP); }

// ─── DYNAMIC SLEEP WIND-DOWN MATH ───
export async function scheduleSleepWindDown(bedTimeStr = "23:00") {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.SLEEP);

  const [bHour, bMinute] = bedTimeStr.split(':').map(Number);
  
  let reminderHour = bHour;
  let reminderMinute = bMinute - 30;
  
  if (reminderMinute < 0) {
    reminderMinute += 60;
    reminderHour = (reminderHour - 1 + 24) % 24;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Wind-down time',
      body: 'Bedtime is in 30 minutes. Start winding down for better sleep quality.',
      sound: true,
      data: { category: CATEGORY.SLEEP },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHour,
      minute: reminderMinute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelSleepWindDown() { await cancelByCategory(CATEGORY.SLEEP); }

export async function scheduleStreakRiskAlert(hour = 20, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.STREAK);
  await Notifications.scheduleNotificationAsync({
    content: { title: '🔥 Your streak is waiting', body: 'You still have time today to hit your goals.', sound: true, data: { category: CATEGORY.STREAK } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}

export async function cancelStreakRiskAlert() { await cancelByCategory(CATEGORY.STREAK); }

export async function fireGoalProgressNotification(goalLabel) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title: '🎯 Goal reached!', body: `You hit your ${goalLabel} goal for today. Nice work.`, sound: true, data: { category: CATEGORY.GOAL } },
    trigger: null, 
  });
}

export async function restoreNotifications(settings) {
  ensureNotificationHandler();
  if (!settings || !settings.masterEnabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  if (settings.hydration) await scheduleWaterReminders(); else await cancelWaterReminders();
  if (settings.dailyBriefing) await scheduleMorningCheckIn(); else await cancelMorningCheckIn();
  if (settings.stepActivity) await scheduleStepActivityReminder(); else await cancelStepActivityReminder();
  if (settings.streakAlerts) await scheduleStreakRiskAlert(); else await cancelStreakRiskAlert();
}