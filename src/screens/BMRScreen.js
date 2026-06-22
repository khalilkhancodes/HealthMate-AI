import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { key: 'light', label: 'Light', multiplier: 1.375 },
  { key: 'moderate', label: 'Moderate', multiplier: 1.55 },
  { key: 'active', label: 'Active', multiplier: 1.725 },
];

export default function BMRScreen() {
  const { COLORS, FONTS, SHADOWS } = useTheme();

  const storeAge = useHealthStore((s) => s.age);
  const storeGender = useHealthStore((s) => s.gender);
  const storeHeightCm = useHealthStore((s) => s.heightCm);
  const storeWeightKg = useHealthStore((s) => s.weightKg);
  const storeActivityLevel = useHealthStore((s) => s.activityLevel);
  const storeTDEE = useHealthStore((s) => s.tdee);

  const setWeightKg = useHealthStore((state) => state.setWeightKg);
  const setHeightCm = useHealthStore((state) => state.setHeightCm);
  const setAge = useHealthStore((state) => state.setAge);
  const setGenderStore = useHealthStore((state) => state.setGender);
  const setActivityLevelStore = useHealthStore((state) => state.setActivityLevel);
  const calculateBMRStore = useHealthStore((state) => state.calculateBMR);
  const calculateBMIStore = useHealthStore((state) => state.calculateBMI);

  const [gender, setGender] = useState(storeGender || 'male');
  const [age, setAgeLocal] = useState(storeAge ? String(storeAge) : '');
  const [weight, setWeight] = useState(storeWeightKg ? String(storeWeightKg) : '');
  const [height, setHeight] = useState(storeHeightCm ? String(storeHeightCm) : '');
  const [activityKey, setActivityKey] = useState(storeActivityLevel || 'moderate');
  const [resultCalories, setResultCalories] = useState(storeTDEE || null);
  const [showErrors, setShowErrors] = useState(false);

  const handleCalculateBMR = () => {
    if (!weight?.trim() || !height?.trim() || !age?.trim() || !gender || !activityKey) {
      setShowErrors(true);
      Alert.alert('Missing Information', 'Please fill out all fields before calculating.');
      return;
    }

    const parsedAge = Number.parseFloat(age);
    const parsedWeight = Number.parseFloat(weight);
    const parsedHeight = Number.parseFloat(height);

    if (!parsedAge || !parsedWeight || !parsedHeight) {
      setShowErrors(true);
      Alert.alert('Invalid Data', 'Please enter valid numeric values for age, weight, and height.');
      return;
    }

    setShowErrors(false);

    // Sync to Global Engine
    setWeightKg(Number(parsedWeight.toFixed(1)));
    setHeightCm(Number(parsedHeight.toFixed(1)));
    setAge(Number(parsedAge));
    setGenderStore(gender);
    setActivityLevelStore(activityKey);

    calculateBMIStore();
    const metrics = calculateBMRStore();
    
    setResultCalories(metrics.tdee);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: COLORS.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} enabled={true}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: COLORS.card }, SHADOWS.small]}>
          <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginBottom: 12 }]}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
                gender === 'male' && { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('male')}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'male' ? COLORS.card : COLORS.border }]}> 
                <Ionicons name="male" size={24} color={gender === 'male' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[FONTS.subheading, { color: gender === 'male' ? COLORS.primary : COLORS.textMuted }]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 },
                gender === 'female' && { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('female')}
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
              { backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, color: COLORS.textPrimary },
              showErrors && !age?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
            ]}
            placeholder="Enter age"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={age}
            onChangeText={setAgeLocal}
          />

          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' }]}>Weight (kg)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, color: COLORS.textPrimary },
              showErrors && !weight?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
            ]}
            placeholder="Enter weight"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={[FONTS.bodyText, { color: COLORS.textMuted, marginBottom: 8, fontWeight: '600' }]}>Height (cm)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: COLORS.inputBackground, borderColor: COLORS.border, color: COLORS.textPrimary },
              showErrors && !height?.trim() && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
            ]}
            placeholder="Enter height"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />

          <Text style={[FONTS.sectionHeading, { color: COLORS.textPrimary, marginTop: 12, marginBottom: 12 }]}>Activity Level</Text>
          {ACTIVITY_LEVELS.map((level) => {
            const selected = level.key === activityKey;

            return (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.activityCard,
                  { backgroundColor: COLORS.surface, borderColor: COLORS.border },
                  selected && { borderColor: COLORS.primary, backgroundColor: COLORS.primaryContainer },
                  showErrors && !activityKey && { borderColor: COLORS.error, backgroundColor: COLORS.error + '1A' },
                ]}
                activeOpacity={0.85}
                onPress={() => setActivityKey(level.key)}
              >
                <View style={styles.activityCopy}>
                  <View style={[styles.activityIconWrap, { backgroundColor: selected ? COLORS.card : COLORS.border }]}> 
                    <Ionicons name={selected ? 'pulse' : 'walk'} size={18} color={selected ? COLORS.primary : COLORS.textMuted} />
                  </View>
                  <View style={styles.activityTextWrap}>
                    <Text style={[FONTS.subheading, { color: selected ? COLORS.primary : COLORS.textPrimary }]}>{level.label}</Text>
                    <Text style={[FONTS.smallText, { color: COLORS.textMuted, marginTop: 2 }]}>Daily activity multiplier</Text>
                  </View>
                </View>
                <View style={[styles.activityMultiplierPill, { backgroundColor: selected ? COLORS.primary : COLORS.border }]}> 
                  <Text style={[FONTS.label, { color: selected ? COLORS.onPrimary : COLORS.textMuted, fontWeight: '700' }]}>x{level.multiplier}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.calculateButton, { backgroundColor: COLORS.primary }]}
            activeOpacity={0.9}
            onPress={handleCalculateBMR}
          >
            <Text style={[FONTS.buttonText, { color: COLORS.onPrimary }]}>Update & Calculate TDEE</Text>
          </TouchableOpacity>
        </View>

        {resultCalories !== null && (
          <View style={[styles.resultCard, { backgroundColor: COLORS.card }, SHADOWS.small]}>
            <Text style={[FONTS.bodyText, { color: COLORS.textSecondary, marginBottom: 6 }]}>Estimated Daily Calories (TDEE)</Text>
            <Text style={[FONTS.bigNumbers, { color: COLORS.textPrimary }]}>{resultCalories.toLocaleString()}</Text>
            <Text style={[FONTS.sectionHeading, { color: COLORS.primary, marginTop: 4 }]}>kcal / day</Text>
            
            <View style={[styles.resultBadge, { backgroundColor: COLORS.secondaryContainer }]}> 
              <Ionicons name="flame" size={16} color={COLORS.secondary} />
              <Text style={[FONTS.smallText, { color: COLORS.textSecondary, flex: 1 }]}>Based on your gender, age, size, and activity level</Text>
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
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  genderButton: { width: '48%', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center' },
  genderIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, marginBottom: 20 },
  activityCard: { borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityCopy: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityTextWrap: { flex: 1 },
  activityMultiplierPill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  calculateButton: { marginTop: 16, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  resultCard: { marginTop: 20, borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  resultBadge: { marginTop: 20, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
});