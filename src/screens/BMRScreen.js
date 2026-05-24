import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useTheme } from '../theme/theme';

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
  { key: 'light', label: 'Light', multiplier: 1.375 },
  { key: 'moderate', label: 'Moderate', multiplier: 1.55 },
  { key: 'active', label: 'Active', multiplier: 1.725 },
  { key: 'very-active', label: 'Very Active', multiplier: 1.9 },
];

export default function BMRScreen() {
  const { COLORS, FONTS, isDark } = useTheme();

  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityKey, setActivityKey] = useState('moderate');
  const [resultCalories, setResultCalories] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleCalculateBMR = () => {
    const activityLevel = activityKey;

    if (!weight?.trim() || !height?.trim() || !age?.trim() || !gender || !activityLevel) {
      setShowErrors(true);
      Alert.alert('Missing Information', 'Please fill out all fields before calculating.');
      return;
    }

    const hasAge = !!age?.trim();
    const hasWeight = !!weight?.trim();
    const hasHeight = !!height?.trim();
    const hasActivityLevel = !!activityKey;

    if (!hasAge || !hasWeight || !hasHeight || !hasActivityLevel) {
      setShowErrors(true);
      Alert.alert('Incomplete Data', 'Please fill in all fields to calculate your BMR.');
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

    const baseBMR =
      gender === 'male'
        ? 10 * parsedWeight + 6.25 * parsedHeight - 5 * parsedAge + 5
        : 10 * parsedWeight + 6.25 * parsedHeight - 5 * parsedAge - 161;

    const activityMultiplier =
      ACTIVITY_LEVELS.find((item) => item.key === activityKey)?.multiplier || 1.55;

    const totalCalories = baseBMR * activityMultiplier;
    setShowErrors(false);
    setResultCalories(Math.round(totalCalories));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
          <Text style={[styles.sectionTitle, FONTS.sectionHeading]}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField },
                gender === 'male' && styles.genderButtonActive,
                gender === 'male' && { backgroundColor: isDark ? '#1D2C3A' : '#E7F2FF', borderColor: isDark ? '#2D4D6A' : '#BBD8FF' },
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('male')}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'male' ? (isDark ? '#21415D' : '#DCEBFF') : (isDark ? '#3A3A3A' : '#E5E7EB') }]}> 
                <Ionicons name="male" size={22} color={gender === 'male' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[styles.genderText, { color: COLORS.textMuted }, gender === 'male' && styles.genderTextActive, gender === 'male' && { color: COLORS.primary }]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { backgroundColor: isDark ? '#2A2A2A' : '#EFF4F9' },
                gender === 'female' && styles.genderButtonActive,
                gender === 'female' && { backgroundColor: isDark ? '#1D2C3A' : '#E7F2FF', borderColor: isDark ? '#2D4D6A' : '#BBD8FF' },
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('female')}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'female' ? (isDark ? '#4A2A4A' : '#FCE7F3') : (isDark ? '#3A3A3A' : '#E5E7EB') }]}> 
                <Ionicons name="female" size={22} color={gender === 'female' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text style={[styles.genderText, { color: COLORS.textMuted }, gender === 'female' && styles.genderTextActive, gender === 'female' && { color: COLORS.primary }]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Age</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField, borderColor: 'transparent', color: COLORS.textMain },
              showErrors && !age?.trim() && styles.inputError,
              showErrors && !age?.trim() && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
            ]}
            placeholder="Enter age"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Weight (kg)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField, borderColor: 'transparent', color: COLORS.textMain },
              showErrors && !weight?.trim() && styles.inputError,
              showErrors && !weight?.trim() && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
            ]}
            placeholder="Enter weight"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Height (cm)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField, borderColor: 'transparent', color: COLORS.textMain },
              showErrors && !height?.trim() && styles.inputError,
              showErrors && !height?.trim() && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
            ]}
            placeholder="Enter height"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />

          <Text style={[styles.sectionTitle, FONTS.sectionHeading, { color: COLORS.textMain }]}>Activity Level</Text>
          {ACTIVITY_LEVELS.map((level) => {
            const selected = level.key === activityKey;

            return (
              <TouchableOpacity
                key={level.key}
                style={[
                  styles.activityCard,
                  { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField, borderColor: 'transparent' },
                  selected && styles.activityCardActive,
                  selected && { borderColor: COLORS.primary, backgroundColor: isDark ? '#1D2C3A' : '#EEF7FF' },
                  showErrors && !activityKey && styles.inputError,
                  showErrors && !activityKey && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
                ]}
                activeOpacity={0.85}
                onPress={() => setActivityKey(level.key)}
              >
                <View style={styles.activityCopy}>
                  <View style={[styles.activityIconWrap, { backgroundColor: selected ? (isDark ? '#21415D' : '#DCEBFF') : (isDark ? '#3A3A3A' : '#E5E7EB') }]}> 
                    <Ionicons name={selected ? 'pulse' : 'walk'} size={16} color={selected ? COLORS.primary : COLORS.textMuted} />
                  </View>
                  <View style={styles.activityTextWrap}>
                    <Text style={[styles.activityText, { color: COLORS.textMain }, selected && styles.activityTextActive, selected && { color: COLORS.primary }]}> 
                      {level.label}
                    </Text>
                    <Text style={[styles.activityHint, { color: COLORS.textMuted }, selected && { color: COLORS.primary }]}> 
                      Daily activity multiplier
                    </Text>
                  </View>
                </View>
                <View style={[styles.activityMultiplierPill, { backgroundColor: selected ? COLORS.primary : (isDark ? '#3A3A3A' : '#E2E8F0') }]}> 
                  <Text style={[styles.activityMultiplier, { color: selected ? '#FFFFFF' : COLORS.textMuted }, selected && styles.activityTextActive]}> 
                    x{level.multiplier}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.calculateButton, { backgroundColor: COLORS.button }]}
            activeOpacity={0.9}
            onPress={handleCalculateBMR}
          >
            <Text style={[styles.calculateButtonText, FONTS.buttonText, { color: '#FFFFFF' }]}>Calculate BMR</Text>
          </TouchableOpacity>
        </View>

        {resultCalories !== null && (
          <View style={[styles.resultCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
            <Text style={[styles.resultLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Estimated Daily Calories</Text>
            <Text style={[styles.resultValue, FONTS.bigNumbers, { color: COLORS.textMain }]}>{resultCalories.toLocaleString()}</Text>
            <Text style={[styles.resultUnit, FONTS.sectionHeading, { color: COLORS.primary }]}>kcal / day</Text>
            <View style={[styles.resultBadge, { backgroundColor: isDark ? '#1D2C3A' : '#EEF7FF' }]}> 
              <Ionicons name="flame" size={16} color={COLORS.primary} />
              <Text style={[styles.resultBadgeText, { color: COLORS.textMuted }]}>Based on your gender, age, size, and activity level</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  genderButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderWidth: 1,
  },
  genderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
  },
  genderTextActive: {
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputError: {
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCardActive: {
  },
  activityCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activityHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  activityMultiplierPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  activityMultiplier: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityTextActive: {
  },
  calculateButton: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  resultValue: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultUnit: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  resultBadge: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
});
