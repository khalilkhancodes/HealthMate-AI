import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cancelMorningCheckIn,
  cancelWaterReminders,
  fireGoalProgressNotification,
  restoreNotifications,
  scheduleMorningCheckIn,
  scheduleSleepWindDown,
  scheduleStepActivityReminder,
  scheduleStreakRiskAlert,
  scheduleWaterReminders,
} from '../utils/notifications';

export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const subscriptionPlans = [
  {
    id: 'weekly',
    price: '$1.99',
    badge: null,
    features: [
      'AI Health Coaching',
      'Advanced Analytics',
      'Unlimited AI Questions',
      'Custom Meal Plans',
    ],
  },
  {
    id: 'monthly',
    price: '$9.99',
    badge: null,
    features: [
      'AI Health Coaching',
      'Advanced Analytics',
      'Unlimited AI Questions',
      'Custom Meal Plans',
      'Priority Support',
    ],
  },
  {
    id: 'yearly',
    price: '$59.99',
    badge: 'BEST VALUE',
    features: [
      'AI Health Coaching',
      'Advanced Analytics',
      'Unlimited AI Questions',
      'Custom Meal Plans',
      'Priority Support',
      'Early Access to New Features',
    ],
  },
];



export const premiumPricingPlan = {
  trial: 'Start 7-Day Free Trial',
};

let pedometerSubscription = null;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getMonSunIndex = (date = new Date()) => {
  const day = date.getDay();
  return (day + 6) % 7;
};

const getDaysDiff = (fromDateString, toDateString) => {
  if (!fromDateString || !toDateString) return null;
  const from = startOfDay(fromDateString);
  const to = startOfDay(toDateString);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / DAY_IN_MS);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getDefaultAchievements = () => ([
  { id: 1, title: 'First Step', description: 'Complete 1 daily goal', targetStreak: 1, earnedDate: null, icon: 'star' },
  { id: 2, title: '1 Week Warrior', description: 'Reach a 7-day streak', targetStreak: 7, earnedDate: null, icon: 'award' },
  { id: 3, title: 'Fire Starter', description: 'Reach a 3-day streak', targetStreak: 3, earnedDate: null, icon: 'flame' },
  { id: 4, title: 'Consistency Champ', description: 'Reach a 14-day streak', targetStreak: 14, earnedDate: null, icon: 'trophy' },
]);

const unlockAchievementsForStreak = (achievements, currentStreak, today) => {
  if (!Array.isArray(achievements)) {
    return getDefaultAchievements().map((achievement) => (
      currentStreak >= achievement.targetStreak ? { ...achievement, earnedDate: today } : achievement
    ));
  }
  return achievements.map((achievement) => {
    if (achievement.earnedDate) return achievement;
    if (currentStreak >= achievement.targetStreak) return { ...achievement, earnedDate: today };
    return achievement;
  });
};

const generateInsightText = ({ dailySteps, stepGoal, currentWaterMl, waterIntake, waterGoalMl, waterGoal, sleepDuration, sleepGoalHours, sleepGoal, currentStreak }) => {
  const actualWater = currentWaterMl || waterIntake || 0;
  const safeStepGoal = stepGoal || 6000;
  const safeWaterGoal = waterGoalMl ?? waterGoal ?? 2500;
  const safeSleepGoal = sleepGoalHours ?? sleepGoal ?? 8;

  const stepsPercent = (dailySteps / safeStepGoal) * 100;
  const waterPercent = (actualWater / safeWaterGoal) * 100;
  const sleepPercent = (sleepDuration / safeSleepGoal) * 100;

  const allMet = stepsPercent >= 100 && waterPercent >= 100 && sleepPercent >= 100;
  if (allMet) {
    return currentStreak > 1
      ? `Amazing! All goals met. You're on a ${currentStreak}-day streak! Keep it up! 🔥`
      : 'Fantastic! You crushed all your goals yesterday. Let\'s make it a streak! 💪';
  }

  const missed = [];
  if (stepsPercent < 100) missed.push('steps');
  if (waterPercent < 100) missed.push('water');
  if (sleepPercent < 100) missed.push('sleep');

  const missedText = missed.join(' & ');
  return `You missed your ${missedText} goal yesterday. Let's do better today! 💡`;
};

const getDefaultNotificationSettings = () => ({
  masterEnabled: true,
  hydration: true,
  stepActivity: true,
  sleepReminder: true,
  goalProgress: true,
  streakAlerts: true,
  dailyBriefing: true,
});

export const useHealthStore = create(
  persist(
    (set, get) => ({
      hasCompletedSetup: false,
      hasCelebratedToday: false,
      currentStreak: 0,
      longestStreak: 0,
      lastGoalCompletionDate: null,
      weeklyProgress: [false, false, false, false, false, false, false],
      completionHistory: {},
      achievements: getDefaultAchievements(),
      
      lastDailyResetDate: getTodayDate(),
      lastWakeResetDate: getTodayDate(),
      
      userWakeTime: "08:00", 
      userBedTime: "23:00",  
      lastScheduleUpdateTimestamp: 0,
      timezoneOffset: new Date().getTimezoneOffset(),
      requiresTimezoneUpdate: false,

      shouldPromptDailyGoalUpdate: false,
      needsDailyReview: false,
      insightText: '',
      lastActiveDate: getTodayDate(),

      // Personal Demographics & Goals
      name: '',
      gender: 'other',
      age: '',
      heightCm: 0,
      weightKg: 0,
      targetWeightKg: 0,
      activityLevel: 'moderate',
      primaryGoal: [],

      // ─── RESTORED DEMOGRAPHIC SETTERS ───
      setName: (name) => set({ name }),
      setGender: (gender) => set({ gender }),
      setAge: (age) => set({ age }),
      setPrimaryGoal: (goalsArray) => set({ primaryGoal: goalsArray }),
      setWeightKg: (weightKg) => set({ weightKg }),
      setHeightCm: (heightCm) => set({ heightCm }),
      setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg }),
      setActivityLevel: (activityLevel) => set({ activityLevel }),
      setBMI: (bmi) => set({ bmi }),
      completeSetup: () => set({ hasCompletedSetup: true }),
      setHasCelebratedToday: (value) => set({ hasCelebratedToday: value }),
      dismissDailyGoalPrompt: () => set({ shouldPromptDailyGoalUpdate: false }),

      setStepGoal: (steps) => set({ stepGoal: steps }),
      setSleepGoalHours: (hours) => set({ sleepGoalHours: hours, sleepGoal: hours }),
      setSleepGoal: (hours) => set({ sleepGoalHours: hours, sleepGoal: hours }),
      setWaterIntake: (ml) => set({ waterIntake: ml, currentWaterMl: ml }),
      setWaterGoal: (ml) => set({ waterGoalMl: ml, waterGoal: ml }),
      setCalorieGoal: (calories) => set({ calorieGoal: calories }),
      setBMR: (bmr) => set({ bmr }),
      setTDEE: (tdee) => set({ tdee }),
      setDailySteps: (steps) => set({ dailySteps: steps }),
      setStepCountOffset: (offset) => set({ stepCountOffset: offset }),
      setIsStepTracking: (isTracking) => set({ isStepTracking: isTracking }),
      setSleepDuration: (hours) => set({ sleepDuration: hours }),
      setIsSleeping: (isSleeping) => set({ isSleeping }),
      setSleepStartTime: (timestamp) => set({ sleepStartTime: timestamp }),
      setTodaysDrinks: (drinks) => set({ todaysDrinks: drinks }),
      setConsumedDrinks: (drinks) => set({ consumedDrinks: drinks }),
      setHistoryLogs: (logs) => set({ historyLogs: logs }),
      setIsAlarmEnabled: (enabled) => set({ isAlarmEnabled: enabled }),
      setIsWaterReminderEnabled: (enabled) => set({ isWaterReminderEnabled: enabled }),
      setIsMorningCheckInEnabled: (enabled) => set({ isMorningCheckInEnabled: enabled }),
      setNotificationFeed: (feed) => set({ notificationFeed: feed }),
      setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),

      waterGoalMl: 2500,
      stepGoal: 6000,
      sleepGoalHours: 8,
      calorieGoal: 2000,
      bmi: 0,
      bmr: 0,
      tdee: 0,

      currentWaterMl: 0,
      dailySteps: 0,
      stepCountOffset: 0,
      isStepTracking: false,
      waterIntake: 0,
      waterGoal: null,
      todaysDrinks: [],
      consumedDrinks: [],
      historyLogs: {},
      isAlarmEnabled: true,
      isWaterReminderEnabled: true,
      isMorningCheckInEnabled: true,

      // ─── RESTORED GOAL GENERATION LOGIC ───
      getCalculatedBaselines: () => {
        const { weightKg, activityLevel, primaryGoal, dailySteps } = get();
        const safeWeight = Number(weightKg) || 70;
        let suggestedSteps = 6000;
        if (activityLevel === 'sedentary') suggestedSteps = 5000;
        else if (activityLevel === 'light') suggestedSteps = 7500;
        else if (activityLevel === 'moderate') suggestedSteps = 10000;
        else if (activityLevel === 'active') suggestedSteps = 12000;

        const goals = Array.isArray(primaryGoal) ? primaryGoal : [primaryGoal];
        if (goals.includes('lose_weight')) suggestedSteps += 2000;

        if (dailySteps > suggestedSteps) suggestedSteps = Math.ceil(dailySteps / 500) * 500 + 500;
        suggestedSteps = clamp(suggestedSteps, 3000, 20000);
        
        let suggestedWater = Math.round(safeWeight * 35);
        if (activityLevel === 'moderate' || activityLevel === 'active') suggestedWater += 500;
        suggestedWater = clamp(Math.round(suggestedWater / 100) * 100, 1500, 6000);
        
        let suggestedSleep = 8;
        if (goals.includes('improve_sleep')) suggestedSleep = 8.5;
        
        return { suggestedSteps, suggestedWater, suggestedSleep };
      },

      generateInitialGoals: () => {
        get().calculateBMI();
        get().calculateBMR();
        const baselines = get().getCalculatedBaselines();
        const { tdee, primaryGoal } = get();
        let calculatedCalories = tdee || 2000;
        const goals = Array.isArray(primaryGoal) ? primaryGoal : [primaryGoal];

        if (goals.includes('lose_weight')) calculatedCalories -= 500;
        if (goals.includes('gain_weight')) calculatedCalories += 500;

        set({
          stepGoal: baselines.suggestedSteps,
          waterGoalMl: baselines.suggestedWater,
          waterGoal: baselines.suggestedWater,
          sleepGoalHours: baselines.suggestedSleep,
          sleepGoal: baselines.suggestedSleep,
          calorieGoal: calculatedCalories,
        });
      },
      
      // Alias for UI component binding
      setInitialGoals: () => get().generateInitialGoals(),

      syncProfileFromCloud: (cloudData) => {
        if (!cloudData || !cloudData.hasCompletedSetup) return false;
        
        const biologicalToday = get().lastWakeResetDate;
        const todaysLog = cloudData.historyLogs?.[biologicalToday] || {};

        set((state) => ({
          name: cloudData.name,
          gender: cloudData.gender,
          age: cloudData.age,
          heightCm: cloudData.heightCm,
          weightKg: cloudData.weightKg,
          targetWeightKg: cloudData.targetWeightKg,
          activityLevel: cloudData.activityLevel,
          primaryGoal: cloudData.primaryGoal,
          stepGoal: cloudData.stepGoal,
          waterGoalMl: cloudData.waterGoalMl,
          waterGoal: cloudData.waterGoalMl,
          sleepGoalHours: cloudData.sleepGoalHours,
          sleepGoal: cloudData.sleepGoalHours,
          userWakeTime: cloudData.userWakeTime || state.userWakeTime,
          userBedTime: cloudData.userBedTime || state.userBedTime,
          hasCompletedSetup: true,
          isPremiumUser: cloudData.isPremiumUser || false,

          historyLogs: cloudData.historyLogs || {},
          sleepHistory: cloudData.sleepHistory || state.sleepHistory,
          achievements: cloudData.achievements || state.achievements,
          weeklyProgress: cloudData.weeklyProgress || state.weeklyProgress,

          dailySteps: todaysLog.steps || 0,
          currentWaterMl: todaysLog.water || 0,
          waterIntake: todaysLog.water || 0,
          sleepDuration: todaysLog.sleep || 0,
        }));

        get().calculateBMI();
        get().calculateBMR();
        return true;
      },

      notificationSettings: getDefaultNotificationSettings(),
      notificationFeed: [],
      unreadNotificationCount: 0,

      updateBiologicalSchedule: (newWakeTime, newBedTime, isTimezoneFix = false) => {
        const { lastScheduleUpdateTimestamp } = get();
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000; 

        if (!isTimezoneFix && now - lastScheduleUpdateTimestamp < COOLDOWN) {
          return { success: false, message: 'Schedule locked. You can modify your biological schedule once every 24 hours to protect streak integrity.' };
        }

        const [wakeH, wakeM] = newWakeTime.split(':').map(Number);
        const [bedH, bedM] = newBedTime.split(':').map(Number);
        
        let wakeDate = new Date(); wakeDate.setHours(wakeH, wakeM, 0, 0);
        let bedDate = new Date(); bedDate.setHours(bedH, bedM, 0, 0);
        
        if (wakeDate <= bedDate) wakeDate.setDate(wakeDate.getDate() + 1);
        
        const diffMs = wakeDate - bedDate;
        const sleepHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

        set({
          userWakeTime: newWakeTime,
          userBedTime: newBedTime,
          sleepGoalHours: sleepHours,
          sleepGoal: sleepHours,
          lastScheduleUpdateTimestamp: now,
          timezoneOffset: new Date().getTimezoneOffset(),
          requiresTimezoneUpdate: false
        });

        const { notificationSettings } = get();
        if (notificationSettings?.masterEnabled && notificationSettings?.sleepReminder) {
          scheduleSleepWindDown(newBedTime).catch(() => {});
        }
        
        return { success: true };
      },

      setNotificationSetting: (key, value) => {
        set((state) => ({ notificationSettings: { ...state.notificationSettings, [key]: value } }));
        const settings = get().notificationSettings;

        if (key === 'masterEnabled') {
          if (!value) {
            restoreNotifications({ ...settings, masterEnabled: false }).catch(() => {});
          } else {
            restoreNotifications(settings).catch(() => {});
            if (settings.sleepReminder) scheduleSleepWindDown(get().userBedTime).catch(() => {});
          }
          return;
        }

        if (!settings.masterEnabled) return;

        switch (key) {
          case 'hydration':
            if (value) scheduleWaterReminders().catch(() => {});
            else cancelWaterReminders().catch(() => {});
            break;
          case 'dailyBriefing':
            if (value) scheduleMorningCheckIn().catch(() => {});
            else cancelMorningCheckIn().catch(() => {});
            break;
          case 'stepActivity':
            if (value) scheduleStepActivityReminder().catch(() => {});
            break;
          case 'streakAlerts':
            if (value) scheduleStreakRiskAlert().catch(() => {});
            break;
          case 'sleepReminder': {
            if (value) scheduleSleepWindDown(get().userBedTime).catch(() => {});
            break;
          }
          default: break;
        }
      },

      sleepHistory: [],
      sleepDuration: 0,
      sleepGoal: null,
      isSleeping: false,
      sleepStartTime: null,
      
      aiChatHistory: [],
      addChatMessage: (message) => set((state) => ({ aiChatHistory: [...state.aiChatHistory, message] })),
      
      aiDoctorHistory: [],
      addDoctorMessage: (message) => set((state) => ({ aiDoctorHistory: [...state.aiDoctorHistory, message] })),
      
      aiMealPlannerHistory: [],
      addMealPlannerMessage: (message) => set((state) => ({ aiMealPlannerHistory: [...state.aiMealPlannerHistory, message] })),
      
      aiIngredientHistory: [],
      addIngredientMessage: (message) => set((state) => ({ aiIngredientHistory: [...state.aiIngredientHistory, message] })),
      
      aiCalorieHistory: [],
      addCalorieMessage: (message) => set((state) => ({ aiCalorieHistory: [...state.aiCalorieHistory, message] })),

      _hasHydrated: false,
      isGuestMode: false,
      user: null,
      userAvatar: null,
      isPremiumUser: false,
      setPremiumStatus: (status) => set({ isPremiumUser: status }),
      themePreference: 'system',
      freeAiQuestionsRemaining: 5,

      logDailyData: (metric, value) =>
        set((state) => {
          const targetBiologicalDate = state.lastWakeResetDate;
          return {
            historyLogs: {
              ...state.historyLogs,
              [targetBiologicalDate]: { ...(state.historyLogs[targetBiologicalDate] || {}), [metric]: value },
            },
          };
        }),

      getStepStats: () => {
        const daily = get().dailySteps || 0;
        const goal = get().stepGoal || 6000;
        return {
          progressPercentage: Math.round((daily / goal) * 100) || 0,
          distanceKm: (daily * 0.000762).toFixed(1),
          caloriesBurned: (daily * 0.04).toFixed(0),
          stepsRemaining: Math.max(0, goal - daily),
        };
      },

      setWaterGoalMl: (ml) => {
        set({ waterGoalMl: ml, waterGoal: ml });
        const totalWater = get().currentWaterMl ?? get().waterIntake ?? 0;
        if (ml > 0 && totalWater >= ml) get().processDailyGoalCompletion('water');
      },

      logDrink: (type, amount) => {
        const drink = {
          id: Date.now().toString(),
          type,
          amount,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({
          todaysDrinks: [...state.todaysDrinks, drink],
          consumedDrinks: [...state.consumedDrinks, drink],
          waterIntake: state.waterIntake + amount,
        }));
        get().logDailyData('water', get().getTotalWaterIntake());
      },


      addCategorizedDrink: (type, rawAmount, multiplier = 1) => {
        const net = Math.round((rawAmount || 0) * (typeof multiplier === 'number' ? multiplier : 1));
        const drink = {
          id: Date.now().toString(),
          type: type || 'other',
          amount: rawAmount || 0,
          multiplier: typeof multiplier === 'number' ? multiplier : 1,
          netHydration: net,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({
          todaysDrinks: [...state.todaysDrinks, drink],
          consumedDrinks: [...state.consumedDrinks, drink],
          waterIntake: state.waterIntake + net,
          currentWaterMl: (state.currentWaterMl || 0) + net,
        }));
        const { waterGoalMl, waterGoal } = get();
        const activeWaterGoal = waterGoalMl ?? waterGoal ?? 0;
        const latestWater = get().currentWaterMl || 0;
        if (activeWaterGoal > 0 && latestWater >= activeWaterGoal) {
          get().processDailyGoalCompletion('water');
          cancelWaterReminders().catch((err) => console.warn('Failed to cancel water reminders', err));
        }
        get().logDailyData('water', get().getTotalWaterIntake());
      },

      calculateBMI: () => {
        const { weightKg, heightCm } = get();
        if (!weightKg || !heightCm) { set({ bmi: 0 }); return 0; }
        const calculatedBMI = weightKg / ((heightCm / 100) * (heightCm / 100));
        const finalBmi = Number(calculatedBMI.toFixed(1));
        set({ bmi: finalBmi });
        return finalBmi;
      },

      calculateBMR: () => {
        const { weightKg, heightCm, age, gender, activityLevel } = get();
        if (!weightKg || !heightCm || !age) { set({ bmr: 0, tdee: 0 }); return { bmr: 0, tdee: 0 }; }
        let bmrCalc = (10 * weightKg) + (6.25 * heightCm) - (5 * Number(age));
        bmrCalc = gender === 'male' ? bmrCalc + 5 : bmrCalc - 161;
        let multiplier = 1.2;
        if (activityLevel === 'light') multiplier = 1.375;
        else if (activityLevel === 'moderate') multiplier = 1.55;
        else if (activityLevel === 'active') multiplier = 1.725;
        const tdeeCalc = Math.round(bmrCalc * multiplier);
        set({ bmr: Math.round(bmrCalc), tdee: tdeeCalc });
        return { bmr: Math.round(bmrCalc), tdee: tdeeCalc };
      },

      executeFullReset: (clockToday, triggerSource) => {
        const {
          lastGoalCompletionDate, currentStreak,
          currentWaterMl, waterIntake, waterGoalMl, waterGoal,
          dailySteps, stepGoal,
          sleepDuration, sleepGoalHours, sleepGoal,
          weeklyProgress,
        } = get();

        const daysSinceLastGoalCompletion = lastGoalCompletionDate ? getDaysDiff(lastGoalCompletionDate, clockToday) : null;
        const streakHasBroken = !lastGoalCompletionDate || (daysSinceLastGoalCompletion && daysSinceLastGoalCompletion > 1);
        const nextCurrentStreak = streakHasBroken ? 0 : currentStreak;
        const actualWater = currentWaterMl || waterIntake || 0;
        
        const insightText = generateInsightText({
          dailySteps, stepGoal,
          currentWaterMl: actualWater, waterIntake: 0, waterGoalMl, waterGoal,
          sleepDuration, sleepGoalHours, sleepGoal,
          currentStreak: nextCurrentStreak,
        });

        const todayIndex = getMonSunIndex(new Date());
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];
        if (todayIndex === 0) for (let i = 0; i < 7; i += 1) nextWeeklyProgress[i] = false;
        nextWeeklyProgress[todayIndex] = false;

        if (pedometerSubscription) {
          pedometerSubscription.remove();
          pedometerSubscription = null;
        }

        set({
          lastDailyResetDate: clockToday,
          lastWakeResetDate: clockToday, 
          lastActiveDate: clockToday,
          needsDailyReview: true,
          insightText,
          currentStreak: nextCurrentStreak,
          hasCelebratedToday: false,
          dailySteps: 0,
          stepCountOffset: 0,
          waterIntake: 0,
          currentWaterMl: 0,
          todaysDrinks: [],
          consumedDrinks: [],
          sleepDuration: 0,
          isSleeping: false,
          sleepStartTime: null,
          weeklyProgress: nextWeeklyProgress,
          isStepTracking: false,
        });

        get().startLiveStepTracking();
      },

      checkAndHandleDailyReset: () => get().checkDailyReset(),

      checkDailyReset: () => {
        const today = getTodayDate();
        const { lastWakeResetDate, userWakeTime } = get();

        if (lastWakeResetDate === today) return false;

        const [wakeHour, wakeMinute] = (userWakeTime || "08:00").split(':').map(Number);
        const now = new Date();
        const wakeTimeToday = new Date();
        wakeTimeToday.setHours(wakeHour, wakeMinute, 0, 0);

        if (now.getTime() >= wakeTimeToday.getTime()) {
          get().executeFullReset(today, 'biological_clock');
          return true;
        }
        return false;
      },

      refreshDailyCelebrationState: () => {
        const biologicalToday = get().lastWakeResetDate;
        const { hasCelebratedToday, lastGoalCompletionDate } = get();
        if (hasCelebratedToday && lastGoalCompletionDate !== biologicalToday) set({ hasCelebratedToday: false });
      },

      processDailyGoalCompletion: (goalType = 'water') => {
        const biologicalToday = get().lastWakeResetDate;
        const {
          lastGoalCompletionDate, currentStreak, longestStreak, weeklyProgress,
          currentWaterMl, waterIntake, waterGoalMl, waterGoal,
          dailySteps, stepGoal, sleepDuration, sleepGoalHours, sleepGoal, notificationSettings,
        } = get();

        if (lastGoalCompletionDate === biologicalToday) return;

        const actualWater = currentWaterMl || waterIntake || 0;
        const waterMet = (waterGoalMl ?? waterGoal ?? 0) > 0 && actualWater >= (waterGoalMl ?? waterGoal ?? 0);
        const stepsMet = (stepGoal ?? 0) > 0 && dailySteps >= (stepGoal ?? 0);
        const sleepMet = (sleepGoalHours ?? sleepGoal ?? 0) > 0 && sleepDuration >= (sleepGoalHours ?? sleepGoal ?? 0);
        if (!waterMet || !stepsMet || !sleepMet) return;

        if (notificationSettings?.masterEnabled && notificationSettings?.goalProgress) {
          fireGoalProgressNotification(goalType).catch(() => {});
        }

        const daysDiff = getDaysDiff(lastGoalCompletionDate, biologicalToday);
        let nextCurrentStreak = 1;
        if (daysDiff === 1) nextCurrentStreak = currentStreak + 1;
        else if (daysDiff && daysDiff > 1) nextCurrentStreak = 1;

        const nextLongestStreak = Math.max(longestStreak, nextCurrentStreak);
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];

        const prevAchievements = get().achievements;
        const nextAchievements = unlockAchievementsForStreak(prevAchievements, nextCurrentStreak, biologicalToday);

        const todayIndex = getMonSunIndex(new Date());
        nextWeeklyProgress[todayIndex] = true;

        set({
          currentStreak: nextCurrentStreak,
          longestStreak: nextLongestStreak,
          lastGoalCompletionDate: biologicalToday,
          weeklyProgress: nextWeeklyProgress,
          achievements: nextAchievements,
          completionHistory: { ...get().completionHistory, [biologicalToday]: true },
        });
      },

      completeReview: async (newStepGoal, newWaterGoalMl, newSleepGoalHours) => {
        set({
          needsDailyReview: false,
          stepGoal: newStepGoal,
          waterGoalMl: newWaterGoalMl,
          waterGoal: newWaterGoalMl,
        });
      },

      addWaterMl: (ml) => {
        const drink = { id: Date.now().toString(), type: 'water', amount: ml, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        set((state) => ({
          todaysDrinks: [...state.todaysDrinks, drink],
          consumedDrinks: [...state.consumedDrinks, drink],
          waterIntake: state.waterIntake + ml,
          currentWaterMl: (state.currentWaterMl || 0) + ml,
        }));

        get().logDailyData('water', get().getTotalWaterIntake());
        const { waterGoalMl, waterGoal } = get();
        const activeWaterGoal = waterGoalMl ?? waterGoal ?? 0;
        const latestWater = get().currentWaterMl || 0;
        if (activeWaterGoal > 0 && latestWater >= activeWaterGoal) {
          get().processDailyGoalCompletion('water');
          cancelWaterReminders().catch(() => {});
        }
      },

      getTotalWaterIntake: () => get().todaysDrinks.reduce((total, drink) => total + (typeof drink.netHydration === 'number' ? drink.netHydration : (drink.amount || 0)), 0),

      startLiveStepTracking: async () => {
        if (get().isStepTracking) return true;
        try {
          const available = await Pedometer.isAvailableAsync();
          if (!available) return false;

          let historicalSteps = 0;
          if (Platform.OS === 'ios') {
            const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
            try {
              const historicalData = await Pedometer.getStepCountAsync(startOfToday, new Date());
              historicalSteps = historicalData.steps;
            } catch (_err) {}
          } else {
            historicalSteps = get().dailySteps || 0;
          }

          set({ dailySteps: historicalSteps, stepCountOffset: historicalSteps });

          pedometerSubscription = Pedometer.watchStepCount(({ steps }) => {
            const totalSteps = (get().stepCountOffset || 0) + steps;
            set({ dailySteps: totalSteps });
            const goal = get().stepGoal || 0;
            if (goal > 0 && totalSteps >= goal) get().processDailyGoalCompletion('steps');
          });

          set({ isStepTracking: true });
          return true;
        } catch (_error) { return false; }
      },

      stopLiveStepTracking: () => {
        if (pedometerSubscription) { pedometerSubscription.remove(); pedometerSubscription = null; }
        set({ isStepTracking: false });
      },

      startSleep: () => set({ isSleeping: true, sleepStartTime: Date.now() }),

      stopSleep: (qualityStars = null, mood = null) => {
        const { sleepStartTime, lastWakeResetDate } = get();
        if (!sleepStartTime) { set({ isSleeping: false, sleepStartTime: null }); return; }

        const sleptHours = (Date.now() - sleepStartTime) / (1000 * 60 * 60);
        const roundedSessionHours = Number(sleptHours.toFixed(2));
        const clockToday = getTodayDate();

        if (roundedSessionHours >= 4.0 && lastWakeResetDate !== clockToday) {
          get().executeFullReset(clockToday, 'smart_wake');
        }

        const freshState = get();
        const updatedSleepDuration = Number((freshState.sleepDuration + sleptHours).toFixed(2));
        const quality = roundedSessionHours >= 7.5 ? 'Good' : roundedSessionHours >= 6 ? 'Fair' : 'Poor';

        set({
          sleepDuration: updatedSleepDuration,
          sleepHistory: [{ id: Date.now().toString(), date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }), duration: roundedSessionHours, quality, qualityStars, mood }, ...freshState.sleepHistory],
          isSleeping: false,
          sleepStartTime: null,
        });

        const existingSleep = Number(freshState.historyLogs[freshState.lastWakeResetDate]?.sleep || 0);
        get().logDailyData('sleep', Number((existingSleep + roundedSessionHours).toFixed(2)));
        
        const safeSleepGoal = freshState.sleepGoalHours ?? freshState.sleepGoal ?? 0;
        if (safeSleepGoal > 0 && updatedSleepDuration >= safeSleepGoal) get().processDailyGoalCompletion('sleep');
      },

      setThemePreference: (preference) => set({ themePreference: preference, isDarkMode: preference === 'dark' }),
      clearGuestMode: () => {
        if (pedometerSubscription) { pedometerSubscription.remove(); pedometerSubscription = null; }
        return set({ isGuestMode: false, user: null, isPremiumUser: false, isStepTracking: false });
      },
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
      setUser: (userData) => set({ user: userData }),
      setIsGuestMode: (isGuest) => set({ isGuestMode: isGuest }),
      setHasHydrated: (status) => set({ _hasHydrated: status }),
    }),
    {
      name: 'healthmate-storage-v12', 
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (!state.lastWakeResetDate) state.lastWakeResetDate = state.lastDailyResetDate || getTodayDate();
        if (!state.userWakeTime) state.userWakeTime = "08:00";
        if (!state.userBedTime) state.userBedTime = "23:00";

        const currentOffset = new Date().getTimezoneOffset();
        if (state.timezoneOffset !== currentOffset) {
          state.requiresTimezoneUpdate = true;
        }

        state.checkDailyReset?.();
        state.checkAndHandleDailyReset?.();
        state.refreshDailyCelebrationState?.();
        state.setHasHydrated(true);

        void state.startLiveStepTracking?.();

        if (!state.notificationSettings) state.notificationSettings = getDefaultNotificationSettings();
        if (!state.notificationFeed) state.notificationFeed = [];

        restoreNotifications(state.notificationSettings).catch(() => {});

        if (state.notificationSettings?.masterEnabled && state.notificationSettings?.sleepReminder) {
          scheduleSleepWindDown(state.userBedTime).catch(() => {});
        }
      },
    }
  )
);