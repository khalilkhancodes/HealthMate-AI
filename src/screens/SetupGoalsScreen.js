import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
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
      <View style={[styles.content, { padding: SPACING.lg }]}> 
        <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Set Your Daily Goals</Text>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderRadius: RADII.md }]}> 
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryContainer }]}> 
              <Text style={{ color: COLORS.primary }}>{'🚶'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Daily Steps</Text>
                <Text style={[FONTS.mediumNumbers, { color: COLORS.primary }]}>{Math.round(stepGoal)}</Text>
              </View>
              <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Walking helps cardiovascular health and mood.</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={2000}
              maximumValue={20000}
              step={100}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              value={stepGoal}
              onValueChange={(v) => setStepGoalLocal(v)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>2,000</Text>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>20,000</Text>
            </View>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderRadius: RADII.md }]}> 
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.secondaryContainer }]}> 
              <Text style={{ color: COLORS.secondary }}>{'💧'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Hydration</Text>
                <Text style={[FONTS.mediumNumbers, { color: COLORS.secondary }]}>{waterLiters.toFixed(1)} L</Text>
              </View>
              <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Proper hydration maintains energy and focus.</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.5}
              maximumValue={6}
              step={0.1}
              minimumTrackTintColor={COLORS.water}
              maximumTrackTintColor={COLORS.border}
              value={waterLiters}
              onValueChange={(v) => setWaterLiters(v)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>1.0 L</Text>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>6.0 L</Text>
            </View>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderRadius: RADII.md }]}> 
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.tertiaryContainer }]}> 
              <Text style={{ color: COLORS.tertiary }}>{'🌙'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[FONTS.cardTitle, { color: COLORS.textPrimary }]}>Sleep Duration</Text>
                <Text style={[FONTS.mediumNumbers, { color: COLORS.tertiary }]}>{sleepHours} hrs</Text>
              </View>
              <Text style={[FONTS.cardText, { color: COLORS.textSecondary, marginTop: 6 }]}>Consistent sleep aids recovery and memory.</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={4}
              maximumValue={12}
              step={0.5}
              minimumTrackTintColor={COLORS.purple}
              maximumTrackTintColor={COLORS.border}
              value={sleepHours}
              onValueChange={(v) => setSleepHoursLocal(v)}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>4.0 hrs</Text>
              <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>12.0 hrs</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: COLORS.border, backgroundColor: 'transparent' }]}
            activeOpacity={0.9}
            onPress={() => resetToCurrent()}
          >
            <Text style={[styles.ghostBtnText, { color: COLORS.textPrimary }]}>Keep Current</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: COLORS.primary }]}
            activeOpacity={0.9}
            onPress={() => applyAISuggestion()}
          >
            <Text style={[styles.secondaryBtnText, { color: COLORS.onPrimary || '#FFF' }]}>Smart Auto-Fill</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
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
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 50 },
  title: { fontSize: 22, marginBottom: 12 },
  card: { borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  ghostBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginRight: 10 },
  ghostBtnText: { fontSize: 15, fontWeight: '600' },
  secondaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginLeft: 10 },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  saveButton: { marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '700' },
});