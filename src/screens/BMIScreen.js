import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
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

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const MAX_BMI_DISPLAY = 40;

function getBMICategory(bmi) {
  if (bmi < 18.5) {
    return 'Underweight';
  }
  if (bmi < 25) {
    return 'Normal';
  }
  if (bmi < 30) {
    return 'Overweight';
  }
  return 'Obese';
}

export default function BMIScreen() {
  const { COLORS, FONTS, isDark } = useTheme();

  const [system, setSystem] = useState('metric');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [resultBMI, setResultBMI] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const setWeight = useHealthStore((state) => state.setWeight);
  const setHeight = useHealthStore((state) => state.setHeight);
  const setBMI = useHealthStore((state) => state.setBMI);

  const markerLeft = useMemo(() => {
    if (resultBMI === null) {
      return '0%';
    }

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

    const hasAge = !!age?.trim();
    const hasWeight = !!weightInput?.trim();
    const hasHeight = system === 'metric' ? !!heightCm?.trim() : !!(heightFeet?.trim() || heightInches?.trim());

    if (!hasAge || !hasWeight || !hasHeight) {
      setShowErrors(true);
      Alert.alert('Incomplete Data', 'Please fill in all fields to calculate your BMI.');
      return;
    }

    const parsedWeight = Number.parseFloat(weightInput);

    if (!parsedWeight || parsedWeight <= 0) {
      setShowErrors(true);
      return;
    }

    let heightInMeters = 0;
    let weightInKg = parsedWeight;

    if (system === 'metric') {
      const parsedHeightCm = Number.parseFloat(heightCm);
      if (!parsedHeightCm || parsedHeightCm <= 0) {
        setShowErrors(true);
        return;
      }
      heightInMeters = parsedHeightCm / 100;
    } else {
      const parsedFeet = Number.parseFloat(heightFeet) || 0;
      const parsedInches = Number.parseFloat(heightInches) || 0;
      const totalInches = parsedFeet * 12 + parsedInches;

      if (totalInches <= 0) {
        setShowErrors(true);
        return;
      }

      heightInMeters = totalInches * 0.0254;
      weightInKg = parsedWeight * 0.45359237;
    }

    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    const rounded = Number(bmiValue.toFixed(1));
    setShowErrors(false);

    setWeight(Number(weightInKg.toFixed(1)));
    setHeight(Number(heightInMeters.toFixed(2)));
    setBMI(rounded);
    setResultBMI(rounded);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: COLORS.card,
              shadowColor: isDark ? COLORS.background : '#000000',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, FONTS.sectionHeading]}>Unit System</Text>
          <View style={[styles.toggleRow, { backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField }]}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                system === 'metric' && styles.toggleBtnActive,
                system === 'metric' && { backgroundColor: COLORS.card },
              ]}
              onPress={() => setSystem('metric')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: COLORS.textMuted },
                  system === 'metric' && styles.toggleTextActive,
                  system === 'metric' && { color: COLORS.textPrimary },
                ]}
              >
                Metric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                system === 'imperial' && styles.toggleBtnActive,
                system === 'imperial' && { backgroundColor: COLORS.card },
              ]}
              onPress={() => setSystem('imperial')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: COLORS.textMuted },
                  system === 'imperial' && styles.toggleTextActive,
                  system === 'imperial' && { color: COLORS.textMain },
                ]}
              >
                Imperial
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, FONTS.sectionHeading]}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderCard,
                { backgroundColor: isDark ? '#2A2A2A' : '#EEF2F7' },
                gender === 'male' && styles.genderCardActive,
                gender === 'male' && {
                  backgroundColor: isDark ? '#1D2C3A' : '#DCEBFF',
                  borderColor: isDark ? '#2D4D6A' : '#B3D4FF',
                },
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.85}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'male' ? (isDark ? '#21415D' : '#CFE3FF') : (isDark ? '#3A3A3A' : '#E2E8F0') }]}>
                <Ionicons name="male" size={22} color={gender === 'male' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text
                style={[
                  styles.genderText,
                  { color: COLORS.textMuted },
                  gender === 'male' && styles.genderTextActive,
                  gender === 'male' && { color: COLORS.primary },
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderCard,
                { backgroundColor: isDark ? '#2A2A2A' : '#EEF2F7' },
                gender === 'female' && styles.genderCardActive,
                gender === 'female' && {
                  backgroundColor: isDark ? '#1D2C3A' : '#DCEBFF',
                  borderColor: isDark ? '#2D4D6A' : '#B3D4FF',
                },
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.85}
            >
              <View style={[styles.genderIconWrap, { backgroundColor: gender === 'female' ? (isDark ? '#4A2A4A' : '#FCE7F3') : (isDark ? '#3A3A3A' : '#E2E8F0') }]}>
                <Ionicons name="female" size={22} color={gender === 'female' ? COLORS.primary : COLORS.textMuted} />
              </View>
              <Text
                style={[
                  styles.genderText,
                  { color: COLORS.textMuted },
                  gender === 'female' && styles.genderTextActive,
                  gender === 'female' && { color: COLORS.primary },
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Age</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField,
                borderColor: 'transparent',
                color: COLORS.textMain,
              },
              showErrors && !age?.trim() && styles.inputError,
              showErrors && !age?.trim() && { borderColor: '#EF4444', backgroundColor: '#cbd8e7ff' },
            ]}
            placeholder="Enter age"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Height {system === 'metric' ? '(cm)' : '(ft / in)'}</Text>
          {system === 'metric' ? (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField,
                  borderColor: 'transparent',
                  color: COLORS.textMain,
                },
                showErrors && !heightCm?.trim() && styles.inputError,
                showErrors && !heightCm?.trim() && { borderColor: '#EF4444', backgroundColor: '#cbd8e7ff' },
              ]}
              placeholder="Height in cm"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
            />
          ) : (
            <View style={styles.dualInputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.halfInput,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField,
                    borderColor: 'transparent',
                    color: COLORS.textMain,
                  },
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && styles.inputError,
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && {
                    borderColor: '#EF4444',
                    backgroundColor: '#cbd8e7ff',
                  },
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
                  {
                    backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField,
                    borderColor: 'transparent',
                    color: COLORS.textMain,
                  },
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && styles.inputError,
                  showErrors && !heightFeet?.trim() && !heightInches?.trim() && {
                    borderColor: '#EF4444',
                    backgroundColor: COLORS.inputField,
                  },
                ]}
                placeholder="Inches"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={heightInches}
                onChangeText={setHeightInches}
              />
            </View>
          )}

          <Text style={[styles.inputLabel, FONTS.bodyText, { color: COLORS.textMuted }]}>Weight {system === 'metric' ? '(kg)' : '(lbs)'}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2A2A2A' : COLORS.inputField,
                borderColor: 'transparent',
                color: COLORS.textMain,
              },
              showErrors && !weightInput?.trim() && styles.inputError,
              showErrors && !weightInput?.trim() && { borderColor: '#EF4444', backgroundColor: '#cbd8e7ff' },
            ]}
            placeholder={system === 'metric' ? 'Weight in kg' : 'Weight in lbs'}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={weightInput}
            onChangeText={setWeightInput}
          />

          <TouchableOpacity
            style={[styles.calculateBtn, { backgroundColor: COLORS.button }]}
            onPress={handleCalculate}
            activeOpacity={0.9}
          >
            <Text style={[styles.calculateBtnText, FONTS.buttonText, { color: '#FFFFFF' }]}>Calculate</Text>
          </TouchableOpacity>
        </View>

        {resultBMI !== null && (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: COLORS.card,
                shadowColor: isDark ? COLORS.background : '#000000',
              },
            ]}
          >
            <Text style={[styles.resultTitle, FONTS.subheading]}>Your BMI</Text>
            <Text style={[styles.bmiValue, FONTS.bigNumbers]}>{resultBMI.toFixed(1)}</Text>
            <Text style={[styles.bmiCategory, FONTS.sectionHeading, { color: COLORS.primary }]}>{category}</Text>

            <View style={styles.chartWrap}>
              <View style={[styles.marker, { left: markerLeft }]}> 
                <Text style={[styles.markerText, { color: COLORS.textMain }]}>▼</Text>
              </View>
              <View style={styles.bar}>
                <View style={[styles.segment, { backgroundColor: '#3B82F6' }]} />
                <View style={[styles.segment, { backgroundColor: '#22C55E' }]} />
                <View style={[styles.segment, { backgroundColor: '#F59E0B' }]} />
                <View style={[styles.segment, { backgroundColor: '#EF4444' }]} />
              </View>
              <View style={styles.legendRow}>
                <Text style={[styles.legendText, { color: COLORS.textMuted }]}>{'<18.5'}</Text>
                <Text style={[styles.legendText, { color: COLORS.textMuted }]}>{'18.5-24.9'}</Text>
                <Text style={[styles.legendText, { color: COLORS.textMuted }]}>{'25-29.9'}</Text>
                <Text style={[styles.legendText, { color: COLORS.textMuted }]}>{'30+'}</Text>
              </View>
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
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
  },
  toggleText: {
    fontWeight: '600',
  },
  toggleTextActive: {
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  genderCard: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  genderCardActive: {
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
    fontWeight: '600',
  },
  genderTextActive: {
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  dualInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  inputError: {
  },
  calculateBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  calculateBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  bmiValue: {
    fontSize: 44,
    fontWeight: '800',
    marginTop: 2,
  },
  bmiCategory: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  chartWrap: {
    marginTop: 6,
    position: 'relative',
    paddingTop: 16,
  },
  marker: {
    position: 'absolute',
    top: -2,
    marginLeft: -7,
    zIndex: 1,
  },
  markerText: {
    fontSize: 14,
  },
  bar: {
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
  },
  legendRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
  },
});
