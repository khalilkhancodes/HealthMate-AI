import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
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
      primaryGoal: 'general',

      // Target Metrics
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
      aiChatHistory: [],
      _hasHydrated: false,
      isGuestMode: false,
      user: null,
      userAvatar: null,
      isPremiumUser: false,
      isDarkMode: false,
      themePreference: 'system',
      freeAiQuestionsRemaining: 5,
      decrementAiQuestions: () =>
        set((state) => ({
          freeAiQuestionsRemaining: Math.max(
            0,
            state.freeAiQuestionsRemaining - 1
          ),
        })),

      requestPedometerPermission: async () => {
        try {
          // 1. Check if the hardware sensor even exists
          const available = await Pedometer.isAvailableAsync();
          if (!available) {
            console.warn('[Pedometer] Hardware sensor not available on this device.');
            return false;
          }

          // 2. Request the Android 10+ Physical Activity runtime permission
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('[Pedometer] User denied Physical Activity permission.');
            return false;
          }

          return true;
        } catch (error) {
          console.error('[Pedometer] Error requesting permissions:', error);
          return false;
        }
      },
      
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

      setName: (name) => set({ name }),
      setGender: (gender) => set({ gender }),
      setAge: (age) => set({ age }),
      setPrimaryGoal: (goal) => set({ primaryGoal: goal }),
      setHeightCm: (heightCm) => set({ heightCm }),
      setWeightKg: (weightKg) => set({ weightKg }),
      setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg }),
      setActivityLevel: (activityLevel) => set({ activityLevel }),

      setStepGoal: (steps) => {
        set({ stepGoal: steps });
        const totalSteps = get().dailySteps ?? 0;
        if (steps > 0 && totalSteps >= steps) get().processDailyGoalCompletion('steps');
      },
      setWaterGoalMl: (ml) => {
        set({ waterGoalMl: ml, waterGoal: ml });
        const totalWater = get().currentWaterMl ?? get().waterIntake ?? 0;
        if (ml > 0 && totalWater >= ml) get().processDailyGoalCompletion('water');
      },
      setSleepGoalHours: (hours) => set({ sleepGoalHours: hours, sleepGoal: hours }),
      completeSetup: () => set({ hasCompletedSetup: true }),
      setHasCelebratedToday: (value) => set({ hasCelebratedToday: value }),
      dismissDailyGoalPrompt: () => set({ shouldPromptDailyGoalUpdate: false }),

      // --- ALGORITHMIC ENGINE ---
      calculateBMI: () => {
        const { weightKg, heightCm } = get();
        if (!weightKg || !heightCm) {
          set({ bmi: 0 });
          return 0;
        }
        const calculatedBMI = weightKg / ((heightCm / 100) * (heightCm / 100));
        const finalBmi = Number(calculatedBMI.toFixed(1));
        set({ bmi: finalBmi });
        return finalBmi;
      },

      calculateBMR: () => {
        const { weightKg, heightCm, age, gender, activityLevel } = get();
        if (!weightKg || !heightCm || !age) {
          set({ bmr: 0, tdee: 0 });
          return { bmr: 0, tdee: 0 };
        }

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

      getCalculatedBaselines: () => {
        const { weightKg, activityLevel, primaryGoal, dailySteps } = get();
        const safeWeight = Number(weightKg) || 70;

        let suggestedSteps = 6000;
        if (activityLevel === 'sedentary') suggestedSteps = 5000;
        else if (activityLevel === 'light') suggestedSteps = 7500;
        else if (activityLevel === 'moderate') suggestedSteps = 10000;
        else if (activityLevel === 'active') suggestedSteps = 12000;

        if (primaryGoal === 'lose_weight') suggestedSteps += 2000;
        if (dailySteps > suggestedSteps) suggestedSteps = Math.ceil(dailySteps / 500) * 500 + 500;
        suggestedSteps = clamp(suggestedSteps, 3000, 20000);

        let suggestedWater = Math.round(safeWeight * 35);
        if (activityLevel === 'moderate' || activityLevel === 'active') suggestedWater += 500;
        suggestedWater = clamp(Math.round(suggestedWater / 100) * 100, 1500, 6000);

        let suggestedSleep = 8;
        if (primaryGoal === 'improve_sleep') suggestedSleep = 8.5;

        return { suggestedSteps, suggestedWater, suggestedSleep };
      },

      generateInitialGoals: () => {
        get().calculateBMI();
        get().calculateBMR();
        const baselines = get().getCalculatedBaselines();
        const { tdee, primaryGoal } = get();

        let calculatedCalories = tdee || 2000;
        if (primaryGoal === 'lose_weight') calculatedCalories -= 500;
        else if (primaryGoal === 'gain_weight') calculatedCalories += 500;

        set({
          stepGoal: baselines.suggestedSteps,
          waterGoalMl: baselines.suggestedWater,
          waterGoal: baselines.suggestedWater,
          sleepGoalHours: baselines.suggestedSleep,
          sleepGoal: baselines.suggestedSleep,
          calorieGoal: calculatedCalories
        });
      },

      checkAndHandleDailyReset: () => {
        const today = getTodayDate();
        const { lastDailyResetDate, weeklyProgress } = get();

        if (lastDailyResetDate === today) return false;

        const daysDiff = getDaysDiff(lastDailyResetDate, today) ?? 1;
        const todayIndex = getMonSunIndex(new Date());
        const nextWeeklyProgress = Array.isArray(weeklyProgress) && weeklyProgress.length === 7 ? [...weeklyProgress] : [false, false, false, false, false, false, false];

        if (daysDiff >= 7 || todayIndex === 0) {
          for (let i = 0; i < 7; i += 1) nextWeeklyProgress[i] = false;
        }
        nextWeeklyProgress[todayIndex] = false;

        set({
          lastDailyResetDate: today,
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

        if (pedometerSubscription) {
          pedometerSubscription.remove();
          pedometerSubscription = null;
        }

        set({
          lastActiveDate: today,
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
        } catch (err) {}
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
      getTotalWaterIntake: () =>
        get().todaysDrinks.reduce((total, drink) => total + (typeof drink.netHydration === 'number' ? drink.netHydration : (drink.amount || 0)), 0),
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

        const { waterGoalMl, waterGoal, currentWaterMl, waterIntake } = get();
        const activeWaterGoal = waterGoalMl ?? waterGoal ?? 0;
        const latestWater = currentWaterMl || waterIntake || 0;
        if (activeWaterGoal > 0 && latestWater >= activeWaterGoal) {
          get().processDailyGoalCompletion('water');
          cancelWaterReminders().catch((err) => console.warn('Failed to cancel water reminders', err));
        }
        get().logDailyData('water', get().getTotalWaterIntake());
      },
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
        } catch (_err) {}
      },
      toggleMorningCheckIn: async () => {
        const newState = !get().isMorningCheckInEnabled;
        set({ isMorningCheckInEnabled: newState });
        try {
          if (newState) await scheduleMorningCheckIn();
          else await cancelMorningCheckIn();
        } catch (_err) {}
      },
      setAlarmSound: (sound) => set({ alarmSound: sound }),

      // --- EXPO-SENSORS PEDOMETER CORE (ANDROID COMPATIBLE) ---
      startLiveStepTracking: async () => {
        if (get().isStepTracking) return true;
      
        try {
          const available = await Pedometer.isAvailableAsync();
      
          if (!available) {
            console.warn('Pedometer not available');
            return false;
          }

          let historicalSteps = 0;
      
          // 🛑 FIX: getStepCountAsync is not natively supported on Android.
          if (Platform.OS === 'ios') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            try {
              const historicalData = await Pedometer.getStepCountAsync(
                startOfToday,
                new Date()
              );
              historicalSteps = historicalData.steps;
            } catch (err) {
              console.log('Could not fetch historical steps:', err);
            }
          } else {
            // Android uses the persisted state to resume counting
            historicalSteps = get().dailySteps || 0;
          }
      
          set({
            dailySteps: historicalSteps,
            stepCountOffset: historicalSteps,
          });
      
          pedometerSubscription = Pedometer.watchStepCount(({ steps }) => {
            const totalSteps = (get().stepCountOffset || 0) + steps;
      
            set({
              dailySteps: totalSteps,
            });
      
            const goal = get().stepGoal || 0;
      
            if (goal > 0 && totalSteps >= goal) {
              get().processDailyGoalCompletion('steps');
            }
          });
      
          set({
            isStepTracking: true,
          });
      
          return true;
        } catch (error) {
          console.error('Pedometer Error:', error);
          return false;
        }
      },

      stopLiveStepTracking: () => {
        if (pedometerSubscription) {
          pedometerSubscription.remove();
          pedometerSubscription = null;
        }
      
        set({
          isStepTracking: false,
        });
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
      setWeight: (weight) => set({ weight, weightKg: weight }),
      setHeight: (height) =>
        set({
          height,
          heightCm: Number.isFinite(Number(height)) ? Number(height) * 100 : 0,
        }),
      setBMI: (bmi) => set({ bmi }),
      clearGuestMode: () => {
        if (pedometerSubscription) {
          pedometerSubscription.remove();
          pedometerSubscription = null;
        }

        return set({
          isGuestMode: false,
          user: null,
          isPremiumUser: false,
          isStepTracking: false,
        });
      },
    }),
    {
      name: 'healthmate-storage-v7', 
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