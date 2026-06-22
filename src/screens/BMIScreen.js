import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const MAX_BMI_DISPLAY = 40;

function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export default function BMIScreen() {
  const { COLORS, FONTS, SHADOWS } = useTheme();

  // Load baseline data from store
  const storeAge = useHealthStore((s) => s.age);
  const storeGender = useHealthStore((s) => s.gender);
  const storeHeightCm = useHealthStore((s) => s.heightCm);
  const storeWeightKg = useHealthStore((s) => s.weightKg);
  const storeBMI = useHealthStore((s) => s.bmi);

  const setWeightKg = useHealthStore((state) => state.setWeightKg);
  const setHeightCm = useHealthStore((state) => state.setHeightCm);
  const setAge = useHealthStore((state) => state.setAge);
  const setGenderStore = useHealthStore((state) => state.setGender);
  const calculateBMIStore = useHealthStore((state) => state.calculateBMI);
  const calculateBMRStore = useHealthStore((state) => state.calculateBMR);

  const [system, setSystem] = useState('metric');
  const [gender, setGender] = useState(storeGender || 'male');
  const [age, setAgeLocal] = useState(storeAge ? String(storeAge) : '');
  const [heightCm, setHeightCmLocal] = useState(storeHeightCm ? String(storeHeightCm) : '');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightInput, setWeightInput] = useState(storeWeightKg ? String(storeWeightKg) : '');
  const [resultBMI, setResultBMI] = useState(storeBMI || null);
  const [showErrors, setShowErrors] = useState(false);

  const markerLeft = useMemo(() => {
    if (resultBMI === null) return '0%';
    const clamped = Math.max(0, Math.min(resultBMI, MAX_BMI_DISPLAY));
    return `${(clamped / MAX_BMI_DISPLAY) * 100}%`;
  }, [resultBMI]);

  const category = resultBMI ? getBMICategory(resultBMI) : '';

  const handleCalculate = () => {
    const weight = weightInput?.trim();
    const height = system === 'metric' ? heightCm?.trim() : (heightFeet?.trim() || heightInches?.trim());

    if (!weight || !height || !age?.trim() || !gender) {
      setShowErrors(true);
      Alert.alert('Missing Information', 'Please fill out all fields before calculating.');
      return;
    }

    const parsedWeight = Number.parseFloat(weight);
    if (!parsedWeight || parsedWeight <= 0) {
      setShowErrors(true);
      return;
    }

    let heightInMeters = 0;
    let finalWeightKg = parsedWeight;
    let finalHeightCm = 0;

    if (system === 'metric') {
      const parsedHeightCm = Number.parseFloat(heightCm);
      if (!parsedHeightCm || parsedHeightCm <= 0) {
        setShowErrors(true);
        return;
      }
      heightInMeters = parsedHeightCm / 100;
      finalHeightCm = parsedHeightCm;
    } else {
      const parsedFeet = Number.parseFloat(heightFeet) || 0;
      const parsedInches = Number.parseFloat(heightInches) || 0;
      const totalInches = parsedFeet * 12 + parsedInches;

      if (totalInches <= 0) {
        setShowErrors(true);
        return;
      }

      heightInMeters = totalInches * 0.0254;
      finalHeightCm = heightInMeters * 100;
      finalWeightKg = parsedWeight * 0.45359237;
    }

    setShowErrors(false);

    // Sync to Core Data Engine
    setWeightKg(Number(finalWeightKg.toFixed(1)));
    setHeightCm(Number(finalHeightCm.toFixed(1)));
    setAge(Number(age));
    setGenderStore(gender);
    
    // Trigger global recalculations
    const newBmi = calculateBMIStore();
    calculateBMRStore(); 
    
    setResultBMI(newBmi);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.background }]}behavior= 'padding' enabled = {true}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: COLORS.card }, SHADOWS.small]}>
          <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 12 }]}>Unit System</Text>
          <View style={[styles.toggleRow, { backgroundColor: COLORS.surface }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                system === 'metric' && { backgroundColor: COLORS.card },
                system === 'metric' && SHADOWS.small
              ]}
              onPress={() => setSystem('metric')}
              activeOpacity={0.85}
            >
              <Text style={[FONTS.subheading, { color: system === 'metric' ? COLORS.textPrimary : COLORS.textMuted }]}>Metric</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                system === 'imperial' && { backgroundColor: COLORS.card },
                system === 'imperial' && SHADOWS.small
              ]}
              onPress={() => setSystem('imperial')}
              activeOpacity={0.85}
            >
              <Text style={[FONTS.subheading, { color: system === 'imperial' ? COLORS.textPrimary : COLORS.textMuted }]}>Imperial</Text>
            </TouchableOpacity>
          </View>

          <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 12 }]}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderCard,
                { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
                gender === 'male' && { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary }
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.85}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'male' ? COLORS.card : COLORS.border }]}>
                <Ionicons name="male" size={24} color={gender === 'male' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[FONTS.subheading, { color: gender === 'male' ? COLORS.primary : COLORS.textMuted }]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderCard,
                { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
                gender === 'female' && { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary }
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.85}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'female' ? COLORS.card : COLORS.border }]}>
                <Ionicons name="female" size={24} color={gender === 'female' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[FONTS.subheading, { color: gender === 'female' ? COLORS.primary : COLORS.textMuted }]}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' }]}>Age</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderColor: COLORS.border },
              showErrors && !age?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
            ]}
            placeholder="Enter age"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={age}
            onChangeText={setAgeLocal}
          />

          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' }]}>
            Height {system === 'metric' ? '(cm)' : '(ft / in)'}
          </Text>
          {system === 'metric' ? (
            <TextInput
              style={[
                styles.input,
                { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderColor: COLORS.border },
                showErrors && !heightCm?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
              ]}
              placeholder="Height in cm"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCmLocal}
            />
          ) : (
            <View style={styles.dualInputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.halfInput,
                  { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderColor: COLORS.border },
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
                ]}
                placeholder="Feet"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={heightFeet}
                onChangeText={setHeightFeet}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.halfInput,
                  { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderColor: COLORS.border },
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
                ]}
                placeholder="Inches"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={heightInches}
                onChangeText={setHeightInches}
              />
            </View>
          )}

          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' }]}>
            Weight {system === 'metric' ? '(kg)' : '(lbs)'}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: COLORS.inputBackground, color: COLORS.textPrimary, borderColor: COLORS.border },
              showErrors && !weightInput?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
            ]}
            placeholder={system === 'metric' ? 'Weight in kg' : 'Weight in lbs'}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={weightInput}
            onChangeText={setWeightInput}
          />

          <TouchableOpacity
            style={[styles.calculateBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleCalculate}
            activeOpacity={0.9}
          >
            <Text style={[FONTS.buttonText, { color: COLORS.onPrimary }]}>Update & Calculate</Text>
          </TouchableOpacity>
        </View>

        {resultBMI !== null && (
          <View style={[styles.resultCard, { backgroundColor: COLORS.card }, SHADOWS.small]}>
            <Text style={[FONTS.subheading, { color: COLORS.textSecondary }]}>Your BMI</Text>
            <Text style={[FONTS.bigNumbers, { color: COLORS.textPrimary, marginTop: 4 }]}>{resultBMI.toFixed(1)}</Text>
            <Text style={[FONTS.sectionHeading, { color: COLORS.primary, marginBottom: 16 }]}>{category}</Text>

            <View style={styles.chartWrap}>
              <View style={[styles.marker, { left: markerLeft }]}> 
                <Text style={{ color: COLORS.textPrimary, fontSize: 16 }}>▼</Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.segment, { backgroundColor: COLORS.info }]} />
                <View style={[styles.segment, { backgroundColor: COLORS.success }]} />
                <View style={[styles.segment, { backgroundColor: COLORS.warning }]} />
                <View style={[styles.segment, { backgroundColor: COLORS.error }]} />
              </View>
              <View style={styles.legendRow}>
                <Text style={[FONTS.label, { color: COLORS.textMuted }]}>{'<18.5'}</Text>
                <Text style={[FONTS.label, { color: COLORS.textMuted }]}>{'18.5-24.9'}</Text>
                <Text style={[FONTS.label, { color: COLORS.textMuted }]}>{'25-29.9'}</Text>
                <Text style={[FONTS.label, { color: COLORS.textMuted }]}>{'30+'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  card: { borderRadius: 24, padding: 24 },
  toggleRow: { flexDirection: 'row', borderRadius: 16, padding: 6, marginBottom: 24 },
  toggleBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  genderCard: { width: '48%', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center' },
  genderIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, marginBottom: 20 },
  dualInputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  calculateBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  resultCard: { borderRadius: 24, padding: 24, marginTop: 20 },
  chartWrap: { position: 'relative', paddingTop: 20 },
  marker: { position: 'absolute', top: 0, marginLeft: -8, zIndex: 1 },
  bar: { height: 12, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  segment: { flex: 1 },
  legendRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
});