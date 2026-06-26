import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
function GoalCard({
  COLORS,
  FONTS,
  RADII,
  iconBg,
  iconColor,
  emoji,
  title,
  description,
  valueLabel,
  valueColor,
  min,
  max,
  step,
  value,
  onValueChange,
  trackColor,
  minLabel,
  maxLabel,
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: COLORS.card,
          borderColor: COLORS.border,
          borderRadius: RADII.lg ?? RADII.md,
          shadowColor: COLORS.textPrimary,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Text style={{ color: iconColor, fontSize: 20 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[FONTS.cardTitle, styles.cardTitleText, { color: COLORS.textPrimary }]}>{title}</Text>
          <Text style={[FONTS.cardText, styles.cardDescriptionText, { color: COLORS.textSecondary }]}>
            {description}
          </Text>
        </View>
        <View style={[styles.valuePill, { backgroundColor: iconBg }]}>
          <Text style={[FONTS.mediumNumbers, { color: valueColor }]}>{valueLabel}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
      <View style={styles.sliderBlock}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={trackColor}
          value={value}
          onValueChange={onValueChange}
        />
        <View style={styles.sliderLabelsRow}>
          <Text style={[FONTS.smallText, styles.sliderLabelText, { color: COLORS.textMuted }]}>{minLabel}</Text>
          <Text style={[FONTS.smallText, styles.sliderLabelText, { color: COLORS.textMuted }]}>{maxLabel}</Text>
        </View>
      </View>
    </View>
  );
}
export default function SetupGoalsScreen({ navigation }) {
  const { COLORS, FONTS, SPACING, RADII } = useTheme();
  const stepGoalStore = useHealthStore((s) => s.stepGoal);
  const waterGoalStore = useHealthStore((s) => s.waterGoalMl ?? s.waterGoal ?? 2500);
  const sleepGoalStore = useHealthStore((s) => s.sleepGoalHours ?? s.sleepGoal ?? 8);
  const setStepGoal = useHealthStore((s) => s.setStepGoal);
  const setWaterGoalMl = useHealthStore((s) => s.setWaterGoalMl);
  const setSleepGoalHours = useHealthStore((s) => s.setSleepGoalHours);
  const completeSetup = useHealthStore((s) => s.completeSetup);
  const getCalculatedBaselines = useHealthStore((s) => s.getCalculatedBaselines);
  const [stepGoal, setStepGoalLocal] = useState(stepGoalStore || 6000);
  const [waterLiters, setWaterLiters] = useState((waterGoalStore || 2500) / 1000);
  const [sleepHours, setSleepHoursLocal] = useState(sleepGoalStore || 8);
  const resetToCurrent = () => {
    setStepGoalLocal(stepGoalStore || 6000);
    setWaterLiters((waterGoalStore || 2500) / 1000);
    setSleepHoursLocal(sleepGoalStore || 8);
  };
  const applyAISuggestion = () => {
    // Generate intelligent baselines from current demographic and behavioral data
    const smartBaselines = getCalculatedBaselines();
    setStepGoalLocal(smartBaselines.suggestedSteps);
    setWaterLiters(smartBaselines.suggestedWater / 1000);
    setSleepHoursLocal(smartBaselines.suggestedSleep);
  };
  const handleSave = () => {
    setStepGoal(Math.round(stepGoal));
    setWaterGoalMl(Math.round(waterLiters * 1000));
    setSleepGoalHours(Number(sleepHours));
    completeSetup();
  };
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <View style={[styles.headerBadge, { backgroundColor: COLORS.primaryContainer }]}>
            <Text style={[FONTS.smallText, styles.headerBadgeText, { color: COLORS.primary }]}>DAILY TARGETS</Text>
          </View>
          <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Set Your Daily Goals</Text>
          <Text style={[FONTS.cardText, styles.subtitle, { color: COLORS.textSecondary }]}>
            Fine-tune your targets, or let Smart Auto-Fill personalize them for you.
          </Text>
        </View>
        <GoalCard
          COLORS={COLORS}
          FONTS={FONTS}
          RADII={RADII}
          iconBg={COLORS.primaryContainer}
          iconColor={COLORS.primary}
          emoji="🚶"
          title="Daily Steps"
          description="Walking helps cardiovascular health and mood."
          valueLabel={`${Math.round(stepGoal).toLocaleString()}`}
          valueColor={COLORS.primary}
          min={2000}
          max={20000}
          step={100}
          value={stepGoal}
          onValueChange={(v) => setStepGoalLocal(v)}
          trackColor={COLORS.primary}
          minLabel="2,000"
          maxLabel="20,000"
        />
        <GoalCard
          COLORS={COLORS}
          FONTS={FONTS}
          RADII={RADII}
          iconBg={COLORS.secondaryContainer}
          iconColor={COLORS.secondary}
          emoji="💧"
          title="Hydration"
          description="Proper hydration maintains energy and focus."
          valueLabel={`${waterLiters.toFixed(1)} L`}
          valueColor={COLORS.secondary}
          min={0.5}
          max={6}
          step={0.1}
          value={waterLiters}
          onValueChange={(v) => setWaterLiters(v)}
          trackColor={COLORS.water ?? COLORS.secondary}
          minLabel="1.0 L"
          maxLabel="6.0 L"
        />
        <GoalCard
          COLORS={COLORS}
          FONTS={FONTS}
          RADII={RADII}
          iconBg={COLORS.tertiaryContainer}
          iconColor={COLORS.tertiary}
          emoji="🌙"
          title="Sleep Duration"
          description="Consistent sleep aids recovery and memory."
          valueLabel={`${sleepHours} hrs`}
          valueColor={COLORS.tertiary}
          min={4}
          max={12}
          step={0.5}
          value={sleepHours}
          onValueChange={(v) => setSleepHoursLocal(v)}
          trackColor={COLORS.purple ?? COLORS.tertiary}
          minLabel="4.0 hrs"
          maxLabel="12.0 hrs"
        />
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: COLORS.border, backgroundColor: COLORS.card }]}
            activeOpacity={0.85}
            onPress={() => resetToCurrent()}
          >
            <Text style={[styles.ghostBtnText, { color: COLORS.textPrimary }]}>Keep Current</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: COLORS.primaryContainer,
                borderColor: COLORS.primary,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => applyAISuggestion()}
          >
            <Text style={[styles.secondaryBtnText, { color: COLORS.primary }]}>✨ Smart Auto-Fill</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: COLORS.primary,
              shadowColor: COLORS.primary,
            },
          ]}
          activeOpacity={0.9}
          onPress={() => {
            handleSave();
            if (navigation && navigation.reset) {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          }}
        >
          <Text style={[styles.saveText, FONTS.buttonText, { color: COLORS.onPrimary || COLORS.card }]}>Save Goals</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 56 },
  headerBlock: { marginBottom: 22 },
  headerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 26, marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitleText: { fontSize: 16, marginBottom: 3 },
  cardDescriptionText: { fontSize: 12.5, lineHeight: 17 },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  divider: { height: 1, opacity: 0.6, marginVertical: 14 },
  sliderBlock: {},
  slider: { width: '100%', height: 38 },
  sliderLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderLabelText: { fontSize: 11.5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    marginRight: 10,
  },
  ghostBtnText: { fontSize: 14.5, fontWeight: '600' },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 14.5, fontWeight: '700' },
  saveButton: {
    marginTop: 6,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  saveText: { fontSize: 16.5, fontWeight: '700', letterSpacing: 0.2 },
});