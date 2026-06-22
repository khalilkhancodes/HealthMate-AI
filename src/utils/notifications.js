import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

const CHANNEL_ID = 'healthmate-alerts';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT — why this file changed shape
//
// The previous version did two things at MODULE TOP LEVEL (i.e. the instant
// this file is imported, before any function runs):
//
//   1. Notifications.setNotificationHandler({ ... })
//   2. const { SchedulableTriggerInputTypes } = Notifications;
//
// useHealthStore.js imports several functions from this file. When this file
// has top-level side effects, Metro must fully evaluate it (including step 1
// and 2 above) before useHealthStore.js can finish its own module evaluation.
// If anything in that top-level execution behaves unexpectedly on first
// bundle load (timing, native module not yet ready, etc.), the importing
// module — useHealthStore.js — can come back as `undefined` to whatever
// imported IT, producing exactly the error you saw:
//
//   "useHealthStore is not a function (it is undefined)"
//
// FIX: nothing in this file executes at import time anymore. The handler
// is installed lazily, the trigger-type constant is read fresh inside each
// function call (not destructured once at the top), and every exported
// function is just a function declaration — zero side effects on import.
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Android channel setup ──────────────────────────────────────────────────────
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

  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  await configurePushNotifications();
  return true;
}

// ── Category-scoped cancellation ───────────────────────────────────────────────
async function cancelByCategory(category) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matching = scheduled.filter((n) => n.content?.data?.category === category);
  await Promise.all(
    matching.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function debugListScheduled() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`[Notifications] ${scheduled.length} scheduled:`, JSON.stringify(scheduled, null, 2));
  return scheduled;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. HYDRATION REMINDER — every 3 hours, local, offline-capable
// ═══════════════════════════════════════════════════════════════════════════
export async function scheduleWaterReminders() {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.WATER);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Time to hydrate',
      body: "It's been a few hours — grab some water to stay on track.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { category: CATEGORY.WATER, screen: 'WaterScreen' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3*60*60, // every 3 hours
      repeats: true,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelWaterReminders() {
  await cancelByCategory(CATEGORY.WATER);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MORNING CHECK-IN / DAILY BRIEFING — fixed time daily, local
// ═══════════════════════════════════════════════════════════════════════════
export async function scheduleMorningCheckIn(hour = 8, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.MORNING);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☀️ Good morning!',
      body: "Here's your daily briefing — check today's goals and progress.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { category: CATEGORY.MORNING, screen: 'HomeScreen' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelMorningCheckIn() {
  await cancelByCategory(CATEGORY.MORNING);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. STEP ACTIVITY NUDGE — fixed midday time, local
// ═══════════════════════════════════════════════════════════════════════════
export async function scheduleStepActivityReminder(hour = 14, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.STEP);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏃 Keep moving',
      body: "You're halfway through the day — a short walk can close the gap to your step goal.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      data: { category: CATEGORY.STEP, screen: 'StepScreen' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelStepActivityReminder() {
  await cancelByCategory(CATEGORY.STEP);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SLEEP WIND-DOWN — relative to user's bedtime goal, local
// ═══════════════════════════════════════════════════════════════════════════
export async function scheduleSleepWindDown(bedtimeHour, bedtimeMinute) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.SLEEP);

  let reminderHour = bedtimeHour;
  let reminderMinute = bedtimeMinute - 30;
  if (reminderMinute < 0) {
    reminderMinute += 60;
    reminderHour = (reminderHour - 1 + 24) % 24;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Wind-down time',
      body: 'Bedtime is in 30 minutes. Start winding down for better sleep quality.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      data: { category: CATEGORY.SLEEP, screen: 'SleepScreen' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHour,
      minute: reminderMinute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelSleepWindDown() {
  await cancelByCategory(CATEGORY.SLEEP);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. STREAK AT-RISK ALERT — fixed evening time, local
// ═══════════════════════════════════════════════════════════════════════════
export async function scheduleStreakRiskAlert(hour = 20, minute = 0) {
  ensureNotificationHandler();
  await configurePushNotifications();
  await cancelByCategory(CATEGORY.STREAK);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Your streak is waiting',
      body: 'You still have time today to hit your goals and keep your streak alive.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { category: CATEGORY.STREAK, screen: 'HomeScreen' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelStreakRiskAlert() {
  await cancelByCategory(CATEGORY.STREAK);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. GOAL PROGRESS — fires immediately, not scheduled
// ═══════════════════════════════════════════════════════════════════════════
export async function fireGoalProgressNotification(goalLabel) {
  ensureNotificationHandler();
  await configurePushNotifications();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Goal reached!',
      body: `You hit your ${goalLabel} goal for today. Nice work.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { category: CATEGORY.GOAL, screen: 'HomeScreen' },
    },
    trigger: null, // immediate, one-time
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RESTORE — re-applies all enabled schedules from persisted settings
// ═══════════════════════════════════════════════════════════════════════════
export async function restoreNotifications(settings) {
  ensureNotificationHandler();

  if (!settings || !settings.masterEnabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  if (settings.hydration) await scheduleWaterReminders();
  else await cancelWaterReminders();

  if (settings.dailyBriefing) await scheduleMorningCheckIn();
  else await cancelMorningCheckIn();

  if (settings.stepActivity) await scheduleStepActivityReminder();
  else await cancelStepActivityReminder();

  if (settings.streakAlerts) await scheduleStreakRiskAlert();
  else await cancelStreakRiskAlert();
}

export async function disableAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Manual test helper (development only) ─────────────────────────────────────
export async function triggerTestNotification() {
  ensureNotificationHandler();
  try {
    Alert.alert('Scheduled', 'Minimize the app now. Executing in 10 seconds.');
    await configurePushNotifications();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Successful 🚀',
        body: 'Background handlers are active.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { category: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        repeats: false,
        channelId: CHANNEL_ID,
      },
    });

    console.log('[Notifications] Test scheduled for 10 seconds from now');
  } catch (error) {
    console.error('[Notifications] Test scheduling failed:', error);
    Alert.alert('Notification Error', error.message);
  }
}