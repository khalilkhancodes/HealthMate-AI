import { useUser } from '@clerk/expo';
import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
import { FirebaseService } from '../utils/firebaseService';

const GENDER_OPTIONS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

const ACTIVITY_OPTIONS = [
  { key: 'sedentary', label: 'Sedentary', description: 'Desk work, minimal exercise' },
  { key: 'light', label: 'Lightly Active', description: '1-3 workouts per week' },
  { key: 'moderate', label: 'Moderately Active', description: '3-5 workouts per week' },
  { key: 'active', label: 'Very Active', description: 'Daily training or physical job' },
];

const GOAL_OPTIONS = [
  { key: 'lose_weight', label: 'Lose Weight', description: 'Prioritize calorie deficit and steps' },
  { key: 'gain_weight', label: 'Gain Weight', description: 'Prioritize surplus and protein' },
  { key: 'improve_sleep', label: 'Improve Sleep', description: 'Focus on recovery and rest' },
  { key: 'general', label: 'General Wellness', description: 'Balanced health approach' },
];

const STEP_TITLES = {
  1: 'Basics',
  2: 'Body Metrics',
  3: 'Activity Level',
  4: 'Health Goals',
  5: 'Summary',
  6: 'Review Goals',
};

const INPUT_STYLE = (COLORS) => ({
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
});

export default function OnboardingWizardScreen({ navigation }) {
  const { COLORS, FONTS, RADII, SHADOWS } = useTheme();

  const { user } = useUser();

  const storeName = useHealthStore((s) => s.name);
  const storeGender = useHealthStore((s) => s.gender);
  const storeAge = useHealthStore((s) => s.age);
  const storeHeightCm = useHealthStore((s) => s.heightCm);
  const storeWeightKg = useHealthStore((s) => s.weightKg);
  const storeTargetWeightKg = useHealthStore((s) => s.targetWeightKg);
  const storeActivityLevel = useHealthStore((s) => s.activityLevel);
  const storePrimaryGoal = useHealthStore((s) => s.primaryGoal);

  const setName = useHealthStore((s) => s.setName);
  const setGender = useHealthStore((s) => s.setGender);
  const setAge = useHealthStore((s) => s.setAge);
  const setHeightCm = useHealthStore((s) => s.setHeightCm);
  const setWeightKg = useHealthStore((s) => s.setWeightKg);
  const setTargetWeightKg = useHealthStore((s) => s.setTargetWeightKg);
  const setActivityLevel = useHealthStore((s) => s.setActivityLevel);
  const setPrimaryGoal = useHealthStore((s) => s.setPrimaryGoal);

  const calculateBMI = useHealthStore((s) => s.calculateBMI);
  const generateInitialGoals = useHealthStore((s) => s.generateInitialGoals);
  const completeSetup = useHealthStore((s) => s.completeSetup);

  const setStepGoal = useHealthStore((s) => s.setStepGoal);
  const setWaterGoalMl = useHealthStore((s) => s.setWaterGoalMl);
  const setSleepGoalHours = useHealthStore((s) => s.setSleepGoalHours);

  const [step, setStep] = useState(1);

  const [name, setNameLocal] = useState(storeName || user?.fullName || user?.firstName || '');
  const [gender, setGenderLocal] = useState(storeGender || 'other');
  const [age, setAgeLocal] = useState(storeAge ? String(storeAge) : '');

  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightCm, setHeightCmLocal] = useState(storeHeightCm ? String(storeHeightCm) : '');
  const [heightFt, setHeightFtLocal] = useState('');
  const [heightIn, setHeightInLocal] = useState('');

  const [weightKg, setWeightKgLocal] = useState(storeWeightKg ? String(storeWeightKg) : '');
  const [targetWeightKg, setTargetWeightKgLocal] = useState(storeTargetWeightKg ? String(storeTargetWeightKg) : '');
  const [activityLevel, setActivityLevelLocal] = useState(storeActivityLevel || 'moderate');

  const defaultGoals = Array.isArray(storePrimaryGoal) ? storePrimaryGoal : (storePrimaryGoal ? [storePrimaryGoal] : []);
  const [selectedGoals, setSelectedGoals] = useState(defaultGoals);

  const [reviewStepGoal, setReviewStepGoal] = useState(6000);
  const [reviewWaterGoal, setReviewWaterGoal] = useState(2.5);
  const [reviewSleepGoal, setReviewSleepGoal] = useState(8);

  const calculatedHeightCm = useMemo(() => {
    if (heightUnit === 'cm') return Number(heightCm);
    const ft = Number(heightFt) || 0;
    const inch = Number(heightIn) || 0;
    return (ft * 30.48) + (inch * 2.54);
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const bmiPreview = useMemo(() => {
    const h = calculatedHeightCm;
    const w = Number(weightKg);
    if (!h || !w || h <= 0) return null;
    const bmi = w / ((h / 100) * (h / 100));
    return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
  }, [calculatedHeightCm, weightKg]);

  const progress = (step / 6) * 100;

  const toggleGoal = (key) => {
    if (selectedGoals.includes(key)) {
      setSelectedGoals(selectedGoals.filter(g => g !== key));
    } else {
      setSelectedGoals([...selectedGoals, key]);
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter your name to continue.');
        return;
      }
      if (!age || isNaN(Number(age)) || Number(age) <= 0) {
        Alert.alert('Required', 'Please enter a valid age.');
        return;
      }
    }

    if (step === 2) {
      if (calculatedHeightCm <= 0) {
        Alert.alert('Required', 'Please enter a valid height.');
        return;
      }
      if (!weightKg || isNaN(Number(weightKg)) || Number(weightKg) <= 0) {
        Alert.alert('Required', 'Please enter a valid weight.');
        return;
      }
    }

    if (step === 4 && selectedGoals.length === 0) {
      Alert.alert('Required', 'Please select at least one health goal.');
      return;
    }

    setStep((s) => Math.min(6, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleGeneratePlan = () => {
    const parsedAge = Number(age);
    const parsedWeight = Number(weightKg);
    const parsedTarget = Number(targetWeightKg);

    setName(name.trim());
    setGender(gender);
    setAge(Number.isFinite(parsedAge) ? parsedAge : '');
    setHeightCm(calculatedHeightCm);
    setWeightKg(Number.isFinite(parsedWeight) ? parsedWeight : 0);
    setTargetWeightKg(Number.isFinite(parsedTarget) ? parsedTarget : 0);
    setActivityLevel(activityLevel);
    setPrimaryGoal(selectedGoals);

    calculateBMI();
    generateInitialGoals();

    const store = useHealthStore.getState();
    setReviewStepGoal(store.stepGoal);
    setReviewWaterGoal((store.waterGoalMl || 2500) / 1000);
    setReviewSleepGoal(store.sleepGoalHours || 8);

    setStep(6);
  };

  const handleConfirmGoals = async () => {
    console.log("STEP 1");
    setStepGoal(reviewStepGoal);
    console.log("STEP 2");
    setWaterGoalMl(reviewWaterGoal * 1000);
    console.log("STEP 3");
    setSleepGoalHours(reviewSleepGoal);
    console.log("STEP 4");
    completeSetup();
    console.log("STEP 5");
    navigation.replace('Home');
    console.log("STEP 6");
    // BACKGROUND FIREBASE SYNC: Executes asynchronously to prevent UI blocking
    if (user && user.id) {
      setTimeout(async () => {
        try {
          const currentState = useHealthStore.getState();
          await FirebaseService.backupUserProfile(user.id, currentState);
          console.log("[Firebase] Onboarding configuration securely archived.");
        } catch (error) {
          console.warn("[Firebase] Architecture synchronization failure:", error);
        }
      }, 1000);
    }
  };

  const renderStepHeader = () => (
    <View style={styles.headerWrap}>
      <Text style={[styles.stepLabel, FONTS.smallText, { color: COLORS.textMuted }]}>Step {step} of 6</Text>
      <View style={[styles.progressTrack, { backgroundColor: COLORS.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: COLORS.primary }]} />
      </View>
      <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>{STEP_TITLES[step]}</Text>
      <Text style={[styles.subtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>
        {step === 6 ? 'We calculated these targets based on your profile.' : 'A few details help personalize your health experience.'}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: COLORS.background }]}
      behavior='padding'
      enabled={true}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStepHeader()}

        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderRadius: RADII.lg }, SHADOWS.small]}>
          {step === 1 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Tell us about you</Text>

              <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setNameLocal}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, INPUT_STYLE(COLORS)]}
              />

              <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted }]}>Gender</Text>
              <View style={styles.pillRow}>
                {GENDER_OPTIONS.map((option) => {
                  const selected = gender === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.85}
                      onPress={() => setGenderLocal(option.key)}
                      style={[
                        styles.pill,
                        { borderColor: selected ? COLORS.primary : COLORS.border, backgroundColor: selected ? COLORS.primaryContainer : COLORS.card },
                      ]}
                    >
                      <Text style={{ color: selected ? COLORS.primary : COLORS.textPrimary, fontWeight: '700' }}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted }]}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAgeLocal}
                placeholder="Enter your age"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, INPUT_STYLE(COLORS)]}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Your body metrics</Text>

              <View style={styles.unitToggleRow}>
                <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted, marginTop: 0 }]}>Height</Text>
                <View style={styles.unitPillContainer}>
                  <TouchableOpacity onPress={() => setHeightUnit('cm')} style={[styles.unitPill, heightUnit === 'cm' && { backgroundColor: COLORS.primaryContainer }]}>
                    <Text style={{ fontSize: 12, color: heightUnit === 'cm' ? COLORS.primary : COLORS.textMuted, fontWeight: '700' }}>CM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setHeightUnit('ft')} style={[styles.unitPill, heightUnit === 'ft' && { backgroundColor: COLORS.primaryContainer }]}>
                    <Text style={{ fontSize: 12, color: heightUnit === 'ft' ? COLORS.primary : COLORS.textMuted, fontWeight: '700' }}>FT/IN</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {heightUnit === 'cm' ? (
                <TextInput
                  value={heightCm}
                  onChangeText={setHeightCmLocal}
                  placeholder="e.g. 170"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  style={[styles.input, INPUT_STYLE(COLORS), { marginBottom: 14 }]}
                />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <TextInput
                    value={heightFt}
                    onChangeText={setHeightFtLocal}
                    placeholder="Feet"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, INPUT_STYLE(COLORS), { flex: 1 }]}
                  />
                  <TextInput
                    value={heightIn}
                    onChangeText={setHeightInLocal}
                    placeholder="Inches"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, INPUT_STYLE(COLORS), { flex: 1 }]}
                  />
                </View>
              )}

              <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted }]}>Weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKgLocal}
                placeholder="e.g. 70"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, INPUT_STYLE(COLORS)]}
              />

              <Text style={[styles.label, FONTS.cardText, { color: COLORS.textMuted }]}>Target Weight (kg)</Text>
              <TextInput
                value={targetWeightKg}
                onChangeText={setTargetWeightKgLocal}
                placeholder="Optional"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={[styles.input, INPUT_STYLE(COLORS)]}
              />

              {bmiPreview ? (
                <View style={[styles.previewCard, { backgroundColor: COLORS.primaryContainer }]}>
                  <Text style={[FONTS.cardText, { color: COLORS.primary, fontWeight: '700' }]}>Estimated BMI</Text>
                  <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary, marginTop: 6 }]}>{bmiPreview}</Text>
                </View>
              ) : null}
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Activity level</Text>
              {ACTIVITY_OPTIONS.map((option) => {
                const selected = activityLevel === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.85}
                    onPress={() => setActivityLevelLocal(option.key)}
                    style={[
                      styles.activityCard,
                      { backgroundColor: COLORS.card, borderColor: selected ? COLORS.primary : COLORS.border },
                    ]}
                  >
                    <View style={styles.activityRow}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>{option.label}</Text>
                        <Text style={[FONTS.cardText, { color: COLORS.textMuted, marginTop: 4 }]}>{option.description}</Text>
                      </View>
                      <View style={[styles.activityDot, { borderColor: selected ? COLORS.primary : COLORS.border, backgroundColor: selected ? COLORS.primaryContainer : 'transparent' }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Health Goals (Select Multiple)</Text>
              {GOAL_OPTIONS.map((option) => {
                const selected = selectedGoals.includes(option.key);
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.85}
                    onPress={() => toggleGoal(option.key)}
                    style={[
                      styles.activityCard,
                      { backgroundColor: COLORS.card, borderColor: selected ? COLORS.primary : COLORS.border },
                    ]}
                  >
                    <View style={styles.activityRow}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>{option.label}</Text>
                        <Text style={[FONTS.cardText, { color: COLORS.textMuted, marginTop: 4 }]}>{option.description}</Text>
                      </View>
                      <View style={[styles.checkboxContainer, { borderColor: selected ? COLORS.primary : COLORS.border, backgroundColor: selected ? COLORS.primary : 'transparent' }]}>
                        {selected && <Text style={{ color: COLORS.card, fontSize: 12, fontWeight: '800' }}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Summary</Text>
              <View style={[styles.summaryCard, { backgroundColor: COLORS.background, borderColor: COLORS.border }]}>
                <SummaryRow label="Name" value={name || '—'} COLORS={COLORS} />
                <SummaryRow label="Gender" value={gender} COLORS={COLORS} />
                <SummaryRow label="Age" value={age || '—'} COLORS={COLORS} />
                <SummaryRow label="Height" value={calculatedHeightCm ? `${calculatedHeightCm.toFixed(0)} cm` : '—'} COLORS={COLORS} />
                <SummaryRow label="Weight" value={weightKg ? `${weightKg} kg` : '—'} COLORS={COLORS} />
                <SummaryRow label="Target" value={targetWeightKg ? `${targetWeightKg} kg` : '—'} COLORS={COLORS} />
                <SummaryRow label="Activity" value={ACTIVITY_OPTIONS.find(o => o.key === activityLevel)?.label} COLORS={COLORS} />
                <SummaryRow label="Goals" value={`${selectedGoals.length} Selected`} COLORS={COLORS} />
              </View>
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>AI Suggested Goals</Text>

              <View style={styles.sliderWrap}>
                <View style={styles.sliderHeader}>
                  <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Daily Steps</Text>
                  <Text style={[FONTS.mediumNumbers, { color: COLORS.primary }]}>{Math.round(reviewStepGoal)}</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={2000}
                  maximumValue={20000}
                  step={100}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewStepGoal}
                  onValueChange={setReviewStepGoal}
                />
              </View>

              <View style={styles.sliderWrap}>
                <View style={styles.sliderHeader}>
                  <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Hydration (Liters)</Text>
                  <Text style={[FONTS.mediumNumbers, { color: COLORS.secondary }]}>{reviewWaterGoal.toFixed(1)} L</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1}
                  maximumValue={6}
                  step={0.1}
                  minimumTrackTintColor={COLORS.secondary}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewWaterGoal}
                  onValueChange={setReviewWaterGoal}
                />
              </View>

              <View style={styles.sliderWrap}>
                <View style={styles.sliderHeader}>
                  <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Sleep (Hours)</Text>
                  <Text style={[FONTS.mediumNumbers, { color: COLORS.tertiary }]}>{reviewSleepGoal} hrs</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={4}
                  maximumValue={12}
                  step={0.5}
                  minimumTrackTintColor={COLORS.tertiary}
                  maximumTrackTintColor={COLORS.border}
                  value={reviewSleepGoal}
                  onValueChange={setReviewSleepGoal}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          {step > 1 && step < 5 ? (
            <TouchableOpacity activeOpacity={0.85} onPress={goBack} style={[styles.secondaryBtn, { borderColor: COLORS.border, backgroundColor: COLORS.card }]}>
              <Text style={[styles.secondaryBtnText, { color: COLORS.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ display: 'none' }} />
          )}

          {step < 5 ? (
            <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={[styles.primaryBtn, { backgroundColor: COLORS.primary }]}>
              <Text style={[styles.primaryBtnText, { color: COLORS.onPrimary }]}>Continue</Text>
            </TouchableOpacity>
          ) : step === 5 ? (
            <View style={{ flex: 1, flexDirection: 'column', gap: 8 }}>
              <View style={styles.finalButtonsWrap}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setStep(1)} style={[styles.secondaryBtn, { borderColor: COLORS.border, backgroundColor: COLORS.card }]}>
                  <Text style={[styles.secondaryBtnText, { color: COLORS.textPrimary }]}>Edit Information</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={handleGeneratePlan} style={[styles.primaryBtn, { backgroundColor: COLORS.primary, flex: 1, marginTop: 10 }]}>
                <Text style={[styles.primaryBtnText, { color: COLORS.onPrimary }]}>Generate Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.9} onPress={handleConfirmGoals} style={[styles.primaryBtn, { backgroundColor: COLORS.primary, flex: 1 }]}>
              <Text style={[styles.primaryBtnText, { color: COLORS.onPrimary }]}>Confirm & Start</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value, COLORS }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: COLORS.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, paddingTop: 40, flexGrow: 1 },
  headerWrap: { marginBottom: 18 },
  stepLabel: { marginBottom: 8, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 30 },
  progressFill: { height: '100%', borderRadius: 999 },
  title: { marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: { borderWidth: 1, padding: 18 },
  sectionTitle: { marginBottom: 14 },
  label: { marginTop: 14, marginBottom: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 6, flexWrap: 'wrap' },
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  unitToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  unitPillContainer: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', borderRadius: 8, overflow: 'hidden' },
  unitPill: { paddingHorizontal: 10, paddingVertical: 4 },
  previewCard: { marginTop: 16, borderRadius: 16, padding: 14 },
  activityCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  checkboxContainer: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.2)' },
  summaryLabel: { fontSize: 14, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 12 },
  sliderWrap: { marginBottom: 24 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  footerRow: { marginTop: 18, flexDirection: 'row', alignItems: 'center' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginRight: 10 },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
  primaryBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 4 },
  primaryBtnText: { fontSize: 15, fontWeight: '800' },
  finalButtonsWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
});