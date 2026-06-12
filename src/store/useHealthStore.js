import AsyncStorage from '@react-native-async-storage/async-storage';
import { startStepCounterUpdate, stopStepCounterUpdate } from '@dongminyu/react-native-step-counter';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cancelMorningCheckIn,
  cancelWaterReminders,
  scheduleMorningCheckIn,
  scheduleWaterReminders
} from '../utils/notifications';

export const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const buildDailyGoalSuggestion = ({ dailySteps, stepGoal, currentWaterMl, waterIntake, waterGoalMl, waterGoal, sleepDuration, sleepGoalHours, sleepGoal }) => {
  const safeStepGoal = stepGoal || 6000;
  const safeWaterGoal = waterGoalMl ?? waterGoal ?? 2500;
  const safeSleepGoal = sleepGoalHours ?? sleepGoal ?? 8;
  const actualWater = currentWaterMl || waterIntake || 0;

  let nextSteps = safeStepGoal;
  if (dailySteps >= safeStepGoal) nextSteps = safeStepGoal + 500;
  else if (dailySteps < safeStepGoal * 0.6) nextSteps = Math.max(3000, Math.round((dailySteps || safeStepGoal) / 100) * 100);
  nextSteps = clamp(Math.round(nextSteps / 100) * 100, 3000, 20000);

  let nextWater = safeWaterGoal;
  if (actualWater >= safeWaterGoal) nextWater = safeWaterGoal + 250;
  else if (actualWater < safeWaterGoal * 0.6) nextWater = Math.max(1000, Math.round((actualWater || safeWaterGoal) / 250) * 250);
  nextWater = clamp(Math.round(nextWater / 250) * 250, 1000, 6000);

  let nextSleep = safeSleepGoal;
  if (sleepDuration >= safeSleepGoal) nextSleep = safeSleepGoal + 0.5;
  else if (sleepDuration < safeSleepGoal * 0.75) nextSleep = Math.max(4, Number((sleepDuration || safeSleepGoal).toFixed(1)));
  nextSleep = clamp(Math.round(nextSleep * 2) / 2, 4, 12);

  return { steps: nextSteps, waterMl: nextWater, sleepHours: nextSleep };
};

export const premiumFeatures = [
  'Unlimited AI Health Coaching',
  'Smart Sleep Analysis & Reports',
  'Advanced Weekly Health Insights',
  'Personalized Diet & Workout Suggestions',
];

export const premiumPricingPlan = { trial: '7-Day Free Trial', price: 'Then $9.99 / Month' };

export const subscriptionPlans = [
  { id: 'yearly', title: 'Yearly', badge: 'BEST VALUE', price: '$30', originalPrice: '$60', features: ['Save 50%', 'Unlimited usage', 'Get 7 Days Free'] },
  { id: 'monthly', title: 'Monthly', badge: 'MOST POPULAR', price: '$3', originalPrice: '$10', features: ['Save 30%', 'Unlimited usage', 'Get 3 Days Free'] },
  { id: 'weekly', title: 'Weekly', badge: null, price: '$1', originalPrice: '$1.6', features: ['Save 30%', 'Limited for day', 'Get 3 Days Free'] },
];

const getTomorrowEightAM = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return tomorrow;
};

export const calculateSleepDuration = (wakeUpTime) => {
  const parsedWakeTime = new Date(wakeUpTime);
  if (Number.isNaN(parsedWakeTime.getTime())) return '0h';
  const now = Date.now();
  let wakeTime = parsedWakeTime.getTime();
  if (wakeTime <= now) wakeTime += 24 * 60 * 60 * 1000;
  const durationInHours = (wakeTime - now) / (1000 * 60 * 60);
  const roundedHours = Math.round(durationInHours * 10) / 10;
  return `${roundedHours}h`;
};

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
      shouldPromptDailyGoalUpdate: false,
      dailyGoalSuggestion: null,
      needsDailyReview: false,
      insightText: '',
      lastActiveDate: getTodayDate(),
      waterGoalMl: 2500,
      stepGoal: 6000,
      sleepGoalHours: 8,
      currentWaterMl: 0,
      dailySteps: 0,
      isStepTracking: false,
      waterIntake: 0,
      waterGoal: null,
      todaysDrinks: [],
      consumedDrinks: [],
      historyLogs: {},
      alarmTime: getTomorrowEightAM(),
      isAlarmEnabled: true,
      isWaterReminderEnabled: true,
      isMorningCheckInEnabled: true,
      alarmSound: 'zen',
      sleepHistory: [
        { id: '1', date: 'Apr 17', duration: 7.5, quality: 'Good' },
        { id: '2', date: 'Apr 16', duration: 6.2, quality: 'Fair' },
      ],
      sleepDuration: 0,
      sleepGoal: null,
      isSleeping: false,
      sleepStartTime: null,
      weight: 0,
      height: 0,
      bmi: 0,
      aiChatHistory: [],
      _hasHydrated: false,
      isGuestMode: false,
      user: null,
      userAvatar: null,
      isPremiumUser: false,
      isDarkMode: false,
      themePreference: 'system',
      freeAiQuestionsRemaining: 5,

      // --- STATS CALCULATION MODULE ---
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
      setStepGoal: (steps) => {
        set({ stepGoal: steps });
        const totalSteps = get().dailySteps ?? 0;
        if (steps > 0 && totalSteps >= steps) get().processDailyGoalCompletion('steps');
      },
      setSleepGoalHours: (hours) => set({ sleepGoalHours: hours, sleepGoal: hours }),
      completeSetup: () => set({ hasCompletedSetup: true }),
      setHasCelebratedToday: (value) => set({ hasCelebratedToday: value }),
      dismissDailyGoalPrompt: () => set({ shouldPromptDailyGoalUpdate: false }),
      applyDailyGoalSuggestion: () => {
        const suggestion = get().dailyGoalSuggestion;
        if (!suggestion) {
          set({ shouldPromptDailyGoalUpdate: false });
          return;
        }
        set({
          stepGoal: suggestion.steps,
          waterGoalMl: suggestion.waterMl,
          waterGoal: suggestion.waterMl,
          sleepGoalHours: suggestion.sleepHours,
          sleepGoal: suggestion.sleepHours,
          shouldPromptDailyGoalUpdate: false,
        });
      },
      checkAndHandleDailyReset: () => {
        const today = getTodayDate();
        const { lastDailyResetDate, dailySteps, stepGoal, currentWaterMl, waterIntake, waterGoalMl, waterGoal, sleepDuration, sleepGoalHours, sleepGoal, weeklyProgress } = get();

        if (lastDailyResetDate === today) return false;

        const daysDiff = getDaysDiff(lastDailyResetDate, today) ?? 1;
        const suggestion = buildDailyGoalSuggestion({ dailySteps, stepGoal, currentWaterMl, waterIntake, waterGoalMl, waterGoal, sleepDuration, sleepGoalHours, sleepGoal });

        const todayIndex = getMonSunIndex(new Date());
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];

        if (daysDiff >= 7 || todayIndex === 0) {
          for (let i = 0; i < 7; i += 1) nextWeeklyProgress[i] = false;
        }
        nextWeeklyProgress[todayIndex] = false;

        set({
          lastDailyResetDate: today,
          shouldPromptDailyGoalUpdate: true,
          dailyGoalSuggestion: suggestion,
          hasCelebratedToday: false,
          dailySteps: 0,
          waterIntake: 0,
          currentWaterMl: 0,
          todaysDrinks: [],
          consumedDrinks: [],
          sleepDuration: 0,
          isSleeping: false,
          sleepStartTime: null,
          weeklyProgress: nextWeeklyProgress,
        });
        return true;
      },
      refreshDailyCelebrationState: () => {
        const today = getTodayDate();
        const { hasCelebratedToday, lastGoalCompletionDate } = get();
        if (hasCelebratedToday && lastGoalCompletionDate !== today) set({ hasCelebratedToday: false });
      },
      processDailyGoalCompletion: (_goalType = 'water') => {
        const today = getTodayDate();
        const { lastGoalCompletionDate, currentStreak, longestStreak, weeklyProgress, currentWaterMl, waterIntake, waterGoalMl, waterGoal, dailySteps, stepGoal, sleepDuration, sleepGoalHours, sleepGoal } = get();

        if (lastGoalCompletionDate === today) return;

        const actualWater = currentWaterMl || waterIntake || 0;
        const safeWaterGoal = waterGoalMl ?? waterGoal ?? 0;
        const safeStepGoal = stepGoal ?? 0;
        const safeSleepGoal = sleepGoalHours ?? sleepGoal ?? 0;

        const waterMet = safeWaterGoal > 0 && actualWater >= safeWaterGoal;
        const stepsMet = safeStepGoal > 0 && dailySteps >= safeStepGoal;
        const sleepMet = safeSleepGoal > 0 && sleepDuration >= safeSleepGoal;
        const allGoalsMet = waterMet && stepsMet && sleepMet;

        if (!allGoalsMet) return;

        const daysDiff = getDaysDiff(lastGoalCompletionDate, today);
        let nextCurrentStreak = 1;
        if (daysDiff === 1) nextCurrentStreak = currentStreak + 1;
        else if (daysDiff && daysDiff > 1) nextCurrentStreak = 1;

        const nextLongestStreak = Math.max(longestStreak, nextCurrentStreak);
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];
        const nextAchievements = unlockAchievementsForStreak(get().achievements, nextCurrentStreak, today);

        const todayIndex = getMonSunIndex(new Date());
        nextWeeklyProgress[todayIndex] = true;

        set({
          currentStreak: nextCurrentStreak,
          longestStreak: nextLongestStreak,
          lastGoalCompletionDate: today,
          weeklyProgress: nextWeeklyProgress,
          achievements: nextAchievements,
          completionHistory: { ...get().completionHistory, [today]: true },
        });
      },
      checkDailyReset: () => {
        const today = getTodayDate();
        const { lastActiveDate, lastGoalCompletionDate, currentStreak, currentWaterMl, waterIntake, waterGoalMl, waterGoal, dailySteps, stepGoal, sleepDuration, sleepGoalHours, sleepGoal, weeklyProgress } = get();

        if (lastActiveDate === today) return false;

        const daysSinceLastGoalCompletion = lastGoalCompletionDate ? getDaysDiff(lastGoalCompletionDate, today) : null;
        const streakHasBroken = !lastGoalCompletionDate || (daysSinceLastGoalCompletion && daysSinceLastGoalCompletion > 1);
        const nextCurrentStreak = streakHasBroken ? 0 : currentStreak;

        const actualWater = currentWaterMl || waterIntake || 0;
        const insightText = generateInsightText({ dailySteps, stepGoal, currentWaterMl: actualWater, waterIntake: 0, waterGoalMl, waterGoal, sleepDuration, sleepGoalHours, sleepGoal, currentStreak: nextCurrentStreak });

        const todayIndex = getMonSunIndex(new Date());
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];

        if (todayIndex === 0) {
          for (let i = 0; i < 7; i += 1) nextWeeklyProgress[i] = false;
        }
        nextWeeklyProgress[todayIndex] = false;

        // Force a restart of the native step counter on a new day to reset its internal baseline
        stopStepCounterUpdate();

        set({
          lastActiveDate: today,
          needsDailyReview: true,
          insightText,
          currentStreak: nextCurrentStreak,
          hasCelebratedToday: false,
          dailySteps: 0,
          waterIntake: 0,
          currentWaterMl: 0,
          todaysDrinks: [],
          consumedDrinks: [],
          sleepDuration: 0,
          isSleeping: false,
          sleepStartTime: null,
          weeklyProgress: nextWeeklyProgress,
          isStepTracking: false
        });

        get().startLiveStepTracking();
        return true;
      },
      completeReview: async (newStepGoal, newWaterGoalMl, newSleepGoalHours) => {
        set({
          needsDailyReview: false,
          stepGoal: newStepGoal,
          waterGoalMl: newWaterGoalMl,
          waterGoal: newWaterGoalMl,
          sleepGoalHours: newSleepGoalHours,
          sleepGoal: newSleepGoalHours,
        });
        try {
          await scheduleWaterReminders();
          await scheduleMorningCheckIn();
        } catch (err) {
          console.warn('Failed to schedule daily notifications', err);
        }
      },
      addWaterMl: (ml) => {
        const drink = {
          id: Date.now().toString(),
          type: 'water',
          amount: ml,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({
          todaysDrinks: [...state.todaysDrinks, drink],
          consumedDrinks: [...state.consumedDrinks, drink],
          waterIntake: state.waterIntake + ml,
          currentWaterMl: (state.currentWaterMl || 0) + ml,
        }));

        const { waterGoalMl, waterGoal, currentWaterMl, waterIntake } = get();
        const activeWaterGoal = waterGoalMl ?? waterGoal ?? 0;
        const latestWater = currentWaterMl || waterIntake || 0;
        if (activeWaterGoal > 0 && latestWater >= activeWaterGoal) {
          get().processDailyGoalCompletion('water');
          cancelWaterReminders().catch((err) => console.warn('Failed to cancel water reminders', err));
        }
        get().logDailyData('water', get().getTotalWaterIntake());
      },
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
      setThemePreference: (preference) => set({ themePreference: preference, isDarkMode: preference === 'dark' }),
      toggleDarkMode: () =>
        set((state) => {
          const nextPreference = state.themePreference === 'dark' ? 'light' : 'dark';
          return { isDarkMode: nextPreference === 'dark', themePreference: nextPreference };
        }),
      setUser: (userData) => set({ user: userData }),
      setIsGuestMode: (isGuest) => set({ isGuestMode: isGuest }),
      addChatMessage: (message) => set((state) => ({ aiChatHistory: [...state.aiChatHistory, message] })),
      setHasHydrated: (status) => set({ _hasHydrated: status }),
      logDailyData: (metric, value) =>
        set((state) => {
          const today = getTodayDate();
          return {
            historyLogs: {
              ...state.historyLogs,
              [today]: { ...(state.historyLogs[today] || {}), [metric]: value },
            },
          };
        }),
      setWaterGoal: (goal) => set({ waterGoal: goal, waterGoalMl: goal }),
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
      getTotalWaterIntake: () => get().todaysDrinks.reduce((total, drink) => total + (drink.amount || 0), 0),
      addDrink: (type, amount) => get().logDrink(type, amount),
      addWater: (amount) => get().logDrink('water', amount),
      totalHydration: () => get().getTotalWaterIntake(),
      setSleepDuration: (hours) => set({ sleepDuration: hours }),
      setSleepGoal: (goal) => set({ sleepGoal: goal }),
      setAlarmTime: (time) => set({ alarmTime: time }),
      toggleAlarm: async () => {
        const newState = get().isAlarmEnabled ? false : true;
        set({ isAlarmEnabled: newState });
      },
      toggleWaterReminder: async () => {
        const newState = !get().isWaterReminderEnabled;
        set({ isWaterReminderEnabled: newState });
        try {
          if (newState) await scheduleWaterReminders();
          else await cancelWaterReminders();
        } catch (err) {}
      },
      toggleMorningCheckIn: async () => {
        const newState = !get().isMorningCheckInEnabled;
        set({ isMorningCheckInEnabled: newState });
        try {
          if (newState) await scheduleMorningCheckIn();
          else await cancelMorningCheckIn();
        } catch (err) {}
      },
      setAlarmSound: (sound) => set({ alarmSound: sound }),

      // --- NEW HARDWARE STEP TRACKING CORE ---
      startLiveStepTracking: async () => {
        if (get().isStepTracking) return true;

        console.log('[Pedometer] Initializing Raw Hardware Sensor...');

        try {
          // Instructs the native module to query steps starting from midnight today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          startStepCounterUpdate(startOfToday, (data) => {
            const newDailyTotal = data.steps;

            if (newDailyTotal > get().dailySteps) {
              set({ dailySteps: newDailyTotal });
              
              const goal = get().stepGoal || 0;
              if (goal > 0 && newDailyTotal >= goal) {
                get().processDailyGoalCompletion('steps');
              }
            }
          });

          set({ isStepTracking: true });
          return true;
        } catch (error) {
          console.error('[Pedometer] Failed to start hardware sensor:', error);
          return false;
        }
      },

      stopLiveStepTracking: () => {
        stopStepCounterUpdate();
        set({ isStepTracking: false });
        console.log('[Pedometer] Hardware sensor tracking stopped');
      },

      startSleep: () => set({ isSleeping: true, sleepStartTime: Date.now() }),
      stopSleep: () => {
        const { sleepStartTime, sleepDuration, historyLogs, sleepHistory } = get();
        if (!sleepStartTime) {
          set({ isSleeping: false, sleepStartTime: null });
          return;
        }
        const sleptHours = (Date.now() - sleepStartTime) / (1000 * 60 * 60);
        const roundedSessionHours = Number(sleptHours.toFixed(2));
        const updatedSleepDuration = Number((sleepDuration + sleptHours).toFixed(2));

        const quality = roundedSessionHours >= 7.5 ? 'Good' : roundedSessionHours >= 6 ? 'Fair' : 'Poor';
        const date = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
        const newSleepEntry = { id: Date.now().toString(), date, duration: roundedSessionHours, quality };

        set({
          sleepDuration: updatedSleepDuration,
          sleepHistory: [newSleepEntry, ...sleepHistory],
          isSleeping: false,
          sleepStartTime: null,
        });

        const today = getTodayDate();
        const existingTodaySleep = Number(historyLogs[today]?.sleep || 0);
        const updatedTodaySleep = Number((existingTodaySleep + roundedSessionHours).toFixed(2));

        get().logDailyData('sleep', updatedTodaySleep);
      },
      setWeight: (weight) => set({ weight }),
      setHeight: (height) => set({ height }),
      setBMI: (bmi) => set({ bmi }),
      calculateBMI: () => {
        const { weight, height } = get();
        if (!weight || !height) {
          set({ bmi: 0 });
          return;
        }
        const calculatedBMI = weight / (height * height);
        set({ bmi: Number(calculatedBMI.toFixed(1)) });
      },
      clearGuestMode: () => {
        stopStepCounterUpdate();
        return set({
          isGuestMode: false,
          user: null,
          isPremiumUser: false,
          isStepTracking: false,
        });
      },
    }),
    {
      name: 'healthmate-storage-v5', 
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.checkDailyReset?.();
        state?.checkAndHandleDailyReset?.();
        state?.refreshDailyCelebrationState?.();
        state?.setHasHydrated(true);
        void state?.startLiveStepTracking?.();
      },
    }
  )
);