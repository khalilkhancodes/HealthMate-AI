import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

import { calculateSleepDuration, useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

function formatElapsedTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export default function SleepScreen() {
  const { COLORS, FONTS, RADII, SHADOWS } = useTheme();

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState(8);
  const [sound, setSound] = useState(null);

  const alarmTime = useHealthStore((state) => state.alarmTime);
  const setAlarmTime = useHealthStore((state) => state.setAlarmTime);
  const isAlarmEnabled = useHealthStore((state) => state.isAlarmEnabled);
  const toggleAlarm = useHealthStore((state) => state.toggleAlarm);
  const alarmSound = useHealthStore((state) => state.alarmSound);
  const setAlarmSound = useHealthStore((state) => state.setAlarmSound);
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);
  const isSleeping = useHealthStore((state) => state.isSleeping);
  const sleepStartTime = useHealthStore((state) => state.sleepStartTime);
  const startSleep = useHealthStore((state) => state.startSleep);
  const stopSleep = useHealthStore((state) => state.stopSleep);
  const sleepGoalHours = useHealthStore((state) => state.sleepGoalHours);
  const setSleepGoalHours = useHealthStore((state) => state.setSleepGoalHours);

  const formattedAlarmTime = useMemo(
    () =>
      new Date(alarmTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    [alarmTime]
  );

  const goalDuration = useMemo(() => calculateSleepDuration(alarmTime), [alarmTime]);
  const targetHours = Math.max(1, Number.parseFloat(goalDuration) || 8);

  const sessionHours = useMemo(() => {
    const [hours = '0', mins = '0'] = elapsedTime.split(':');
    return Number(hours) + Number(mins) / 60;
  }, [elapsedTime]);

  const sessionProgress = Math.min(100, Math.round((sessionHours / targetHours) * 100));

  const sessionDurationText = useMemo(() => {
    if (!isSleeping) {
      return goalDuration.replace('.', 'h ') + (goalDuration.includes('.') ? 'm' : '');
    }
    const [hours = '00', mins = '00'] = elapsedTime.split(':');
    return `${Number(hours)}h ${mins}m`;
  }, [isSleeping, elapsedTime, goalDuration]);

  useEffect(() => {
    if (!isSleeping || !sleepStartTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(formatElapsedTime(Date.now() - sleepStartTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [isSleeping, sleepStartTime]);

  const handleAlarmChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setIsPickerVisible(false);
      return;
    }

    if (selectedDate) {
      setAlarmTime(selectedDate);
    }

    setIsPickerVisible(false);
  };

  const handlePremiumTeasePress = () => {
    Alert.alert('Premium Feature', 'Sleep Quality Analysis is a Premium feature.');
  };

  const handleStartSleep = () => {
    console.log('Trigger Native Alarm');
    startSleep();
  };

  const handleGoalEditorOpen = () => {
    setTempGoalHours(sleepGoalHours || 8);
    setShowGoalEditor(true);
  };

  const handleGoalEditorSave = () => {
    setSleepGoalHours(tempGoalHours);
    setShowGoalEditor(false);
  };

  const handlePlayAlarmSound = async () => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Map alarm sound names to audio files
      const soundMap = {
        zen: require('../../assets/sounds/Zen.mp3'),
        sunrise: require('../../assets/sounds/Sunrise.mp3'),
        classic: require('../../assets/sounds/classic.mp3'),
      };

      const soundFile = soundMap[alarmSound] || soundMap.zen;
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      setSound(newSound);
      await newSound.playAsync();
      console.log(`Playing ${alarmSound} alarm sound...`);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      Alert.alert('Error', 'Failed to play alarm sound. Please check your device settings.');
    }
  };

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[COLORS.startGradient, COLORS.endGradient]} style={styles.sessionCard}>
          <View style={styles.sessionTopRow}>
            <View>
              <Text style={styles.sessionLabel}>CURRENT SESSION</Text>
              <Text style={[styles.sessionTitle, { color: COLORS.bigNumbers }]}>{isSleeping ? 'Deep Sleep' : 'Sleep Prep'}</Text>
            </View>

            <View style={styles.trackingBadge}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingBadgeText}>{isSleeping ? 'Tracking...' : 'Ready'}</Text>
            </View>
          </View>

          <View style={styles.progressRingWrap}>
            <CircularProgress
              value={isSleeping ? sessionHours : 0}
              maxValue={targetHours}
              radius={96}
              activeStrokeColor={COLORS.primary}
              inActiveStrokeColor={COLORS.border}
              activeStrokeWidth={13}
              inActiveStrokeWidth={13}
              showProgressValue={false}
            />

            <View style={styles.progressTextWrap}>
              <Text style={[styles.progressDuration, FONTS.mediumNumbers, { color: COLORS.bigNumbers }]}>{sessionDurationText}</Text>
              <Text style={[styles.progressCaption, FONTS.bodyText, { color: COLORS.textSecondary }]}>Duration</Text>
            </View>
          </View>

          <View style={styles.sessionButtonRow}>
            <TouchableOpacity
              style={[styles.primarySessionButton, { backgroundColor: isSleeping ? COLORS.error : COLORS.success }]}
              activeOpacity={0.9}
              onPress={isSleeping ? stopSleep : handleStartSleep}
            >
              <Ionicons name={isSleeping ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color={COLORS.bigNumbers} />
              <Text style={[styles.primarySessionButtonText, FONTS.buttonText, { color: COLORS.bigNumbers }]}>
                {isSleeping ? 'Stop Sleep' : 'Start Sleep'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.alarmSessionButton} activeOpacity={0.9} onPress={() => setIsPickerVisible(true)}>
              <Ionicons name="moon-outline" size={24} color={COLORS.bigNumbers} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sessionMeta, FONTS.smallText, { color: COLORS.textSecondary }]}> 
            {isSleeping ? `Elapsed ${elapsedTime.split(':').slice(0, 2).join(':')} • Goal ${targetHours}h` : `Alarm ${formattedAlarmTime} • Goal ${targetHours}h`}
          </Text>
        </LinearGradient>

        {isPickerVisible && (
          <DateTimePicker
            value={new Date(alarmTime)}
            mode="time"
            display="default"
            onChange={handleAlarmChange}
          />
        )}

        {/* Alarm & Goal Settings Card */}
        <View style={[styles.alarmCard, { backgroundColor: COLORS.card, borderRadius: RADII.lg, ...SHADOWS.small }]}> 
          <View style={styles.alarmRow}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setIsPickerVisible(true)}>
              <Text style={[FONTS.mediumNumbers, { color: COLORS.textPrimary }]}>{formattedAlarmTime}</Text>
            </TouchableOpacity>

            <Switch value={Boolean(isAlarmEnabled)} onValueChange={toggleAlarm} trackColor={{ true: COLORS.primaryContainer, false: COLORS.inputBackground }} thumbColor={isAlarmEnabled ? COLORS.primary : COLORS.onPrimary} />
          </View>

          {isAlarmEnabled && (
            <>
              <View style={styles.soundRow}>
                {[
                  { key: 'zen', label: 'Zen' },
                  { key: 'sunrise', label: 'Sunrise' },
                  { key: 'classic', label: 'Classic' },
                ].map((s) => {
                  const active = alarmSound === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      activeOpacity={0.8}
                      style={[styles.soundPill, { backgroundColor: active ? COLORS.primaryContainer : COLORS.inputBackground }]}
                      onPress={() => setAlarmSound(s.key)}
                    >
                      <Text style={{ color: active ? COLORS.primary : COLORS.textSecondary }}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity activeOpacity={0.8} style={[styles.playButton, { marginTop: 12, backgroundColor: COLORS.primary }]} onPress={handlePlayAlarmSound}>
                <Ionicons name="play-circle-outline" size={16} color={COLORS.onPrimary} />
                <Text style={[FONTS.smallText, { color: COLORS.onPrimary, marginLeft: 6 }]}>Play Preview</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sleep Goal Card */}
        <TouchableOpacity
          style={[styles.metricCard, { backgroundColor: COLORS.card, ...SHADOWS.small, marginBottom: 16 }]}
          activeOpacity={0.85}
          onPress={handleGoalEditorOpen}
        >
          <View style={[styles.metricIconBox, { backgroundColor: COLORS.primaryContainer }]}>
            <Ionicons name="moon-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.metricMainValue, { color: COLORS.primary }]}>{sleepGoalHours || 8}</Text>
          <Text style={[styles.metricHeading, { color: COLORS.textPrimary }]}>Goal Hours</Text>
          <Text style={[styles.metricBody, { color: COLORS.textMuted }]}>Tap to edit</Text>
        </TouchableOpacity>

        <View style={styles.metricsRow}>
          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: COLORS.card, ...SHADOWS.small }]}
            activeOpacity={0.85}
            onPress={!isPremiumUser ? handlePremiumTeasePress : undefined}
          >
            <View style={[styles.metricIconBox, { backgroundColor: COLORS.secondaryContainer }]}>
              <Ionicons name="star-outline" size={20} color={COLORS.secondary} />
            </View>
            <Text style={[styles.metricMainValue, { color: isPremiumUser ? COLORS.primary : COLORS.textPrimary }]}>{isPremiumUser ? Math.min(99, Math.round(55 + sessionProgress * 0.4)) : 'Pro'}</Text>
            <Text style={[styles.metricHeading, { color: COLORS.textPrimary }]}>Quality Score</Text>
            <Text style={[styles.metricBody, { color: COLORS.textMuted }]}>{isPremiumUser ? 'Great recovery' : 'Unlock premium'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: COLORS.card, ...SHADOWS.small }]}
            activeOpacity={0.85}
            onPress={!isPremiumUser ? handlePremiumTeasePress : undefined}
          >
            <View style={[styles.metricIconBox, { backgroundColor: COLORS.tertiaryContainer }]}>
              <Ionicons name="leaf-outline" size={20} color={COLORS.tertiary} />
            </View>
            <Text style={[styles.metricMainValue, { color: isPremiumUser ? COLORS.tertiary : COLORS.textPrimary }]}>{isPremiumUser ? '16' : 'Pro'}</Text>
            <Text style={[styles.metricHeading, { color: COLORS.textPrimary }]}>Breaths/min</Text>
            <Text style={[styles.metricBody, { color: COLORS.textMuted }]}>{isPremiumUser ? 'Stable rhythmic' : 'Unlock premium'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary }]}
          activeOpacity={0.9}
          onPress={!isPremiumUser ? handlePremiumTeasePress : undefined}
        >
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={22} color={COLORS.primary} />
            <Text style={[styles.insightTitle, { color: COLORS.primary }]}>Sleep Insight</Text>
          </View>
          <Text style={[styles.insightText, { color: COLORS.textPrimary }]}> 
            {isPremiumUser
              ? "You're getting 15% more deep sleep than last week. Keeping your bedtime consistent helps recovery."
              : 'Upgrade to Premium for personalized sleep trend analysis and nightly coaching.'}
          </Text>
        </TouchableOpacity>

        {/* Goal Editor Modal */}
        <Modal
          visible={showGoalEditor}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGoalEditor(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: COLORS.backdrop }]}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Edit Sleep Goal</Text>
              <View style={styles.sliderContainer}>
                <Text style={[FONTS.mediumNumbers, { color: COLORS.primary }]}>{tempGoalHours}h</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={4}
                  maximumValue={12}
                  step={0.5}
                  value={tempGoalHours}
                  onValueChange={setTempGoalHours}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>4h</Text>
                  <Text style={[FONTS.smallText, { color: COLORS.textMuted }]}>12h</Text>
                </View>
              </View>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.border }]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    if (sound) {
                      await sound.stopAsync();
                    }
                    setShowGoalEditor(false);
                  }}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  activeOpacity={0.8}
                  onPress={handleGoalEditorSave}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.onPrimary }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  sessionCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.75)',
  },
  sessionTitle: {
    // marginTop: 4,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 50,
  },
  trackingBadge: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,37,58,0.55)',
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  trackingBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  progressTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDuration: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 54,
  },
  progressCaption: {
    marginTop: 2,
    fontSize: 1,
    fontWeight: '600',
  },
  sessionButtonRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  primarySessionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primarySessionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  alarmSessionButton: {
    width: 74,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionMeta: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  alarmCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  soundRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  soundPill: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  metricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricMainValue: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  metricHeading: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
  },
  metricBody: {
    marginTop: 2,
    fontSize: 12,
  },
  weeklyCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  weeklyTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 14,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weeklyBarItem: {
    width: '12.5%',
    alignItems: 'center',
  },
  weeklyBarSegment: {
    width: '90%',
    borderRadius: 2,
    marginBottom: 4,
  },
  weeklyBarLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  insightCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 32,
    fontWeight: '800',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 24,
  },
  playButton: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
