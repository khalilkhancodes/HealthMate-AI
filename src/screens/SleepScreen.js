import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  NativeModules,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircularProgress from 'react-native-circular-progress-indicator';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';
const { AlarmModule } = NativeModules;
const MOODS = [
  { key: 'exhausted', emoji: '😫', label: 'Exhausted' },
  { key: 'tired', emoji: '😔', label: 'Tired' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'great', emoji: '🤩', label: 'Great' },
];
const RINGTONES = [
  { id: 'alarm1', label: '🔔 Morning Bells' },
  { id: 'alarm2', label: '🌅 Gentle Rise' },
  { id: 'alarm3', label: '⚡ Rise & Shine' },
];
function formatElapsedTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
function formatRemainingTime(ms) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}
function getQualityMeta(stars) {
  if (stars >= 5) return { label: 'Excellent', color: '#16A34A', bg: '#DCFCE7' };
  if (stars >= 4) return { label: 'Good', color: '#16A34A', bg: '#DCFCE7' };
  if (stars >= 3) return { label: 'Fair', color: '#D97706', bg: '#FEF3C7' };
  if (stars >= 2) return { label: 'Poor', color: '#EA580C', bg: '#FFEDD5' };
  return { label: 'Very Poor', color: '#DC2626', bg: '#FEE2E2' };
}
export default function SleepScreen() {
  const { COLORS, FONTS, SHADOWS } = useTheme();
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState(8);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [selectedRingtone, setSelectedRingtone] = useState('alarm1');
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  const [showWakeCheckIn, setShowWakeCheckIn] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const isPremiumUser = useHealthStore((s) => s.isPremiumUser);
  const isSleeping = useHealthStore((s) => s.isSleeping);
  const sleepStartTime = useHealthStore((s) => s.sleepStartTime);
  const startSleep = useHealthStore((s) => s.startSleep);
  const stopSleep = useHealthStore((s) => s.stopSleep);
  const sleepGoalHours = useHealthStore((s) => s.sleepGoalHours);
  const setSleepGoalHours = useHealthStore((s) => s.setSleepGoalHours);
  const sleepHistory = useHealthStore((s) => s.sleepHistory);
  const targetHours = Math.max(1, sleepGoalHours || 8);
  const sessionHours = useMemo(() => {
    if (!isSleeping || !sleepStartTime) return 0;
    return (nowMs - sleepStartTime) / (1000 * 60 * 60);
  }, [isSleeping, sleepStartTime, nowMs]);
  const remainingMs = useMemo(() => {
    if (!isSleeping || !sleepStartTime) return targetHours * 60 * 60 * 1000;
    return Math.max(0, targetHours * 60 * 60 * 1000 - (nowMs - sleepStartTime));
  }, [isSleeping, targetHours, sleepStartTime, nowMs]);
  const sessionDurationText = useMemo(() => {
    if (!isSleeping) {
      const hours = Math.floor(targetHours);
      const mins = Math.round((targetHours - hours) * 60);
      return `${hours}h ${String(mins).padStart(2, '0')}m`;
    }
    return formatRemainingTime(remainingMs);
  }, [isSleeping, targetHours, remainingMs]);
  const suggestedBedtime = useMemo(() => {
    const wakeTarget = new Date();
    wakeTarget.setHours(7, 0, 0, 0);
    const bedtime = new Date(wakeTarget.getTime() - targetHours * 60 * 60 * 1000);
    return bedtime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [targetHours]);
  const weekSummary = useMemo(() => {
    const last7 = (sleepHistory || []).slice(0, 7);
    if (last7.length === 0) return { avgHours: 0, debtHours: 0, nightsLogged: 0, avgQuality: 0 };
    const totalHours = last7.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalDebt = last7.reduce((sum, e) => sum + Math.max(0, targetHours - (e.duration || 0)), 0);
    const qEntries = last7.filter((e) => typeof e.qualityStars === 'number');
    const avgQuality = qEntries.length
      ? qEntries.reduce((s, e) => s + e.qualityStars, 0) / qEntries.length
      : 0;
    return {
      avgHours: Number((totalHours / last7.length).toFixed(1)),
      debtHours: Number(totalDebt.toFixed(1)),
      nightsLogged: last7.length,
      avgQuality: Number(avgQuality.toFixed(1)),
    };
  }, [sleepHistory, targetHours]);
  useEffect(() => {
    if (!isSleeping || !sleepStartTime) { setElapsedTime('00:00:00'); return; }
    const timer = setInterval(() => {
      setElapsedTime(formatElapsedTime(Date.now() - sleepStartTime));
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isSleeping, sleepStartTime]);
  const handleStartSleep = () => {
    if (isAlarmEnabled && Platform.OS === 'android' && AlarmModule) {
      const triggerTime = Date.now() + targetHours * 60 * 60 * 1000;
      AlarmModule.setAlarm(triggerTime, selectedRingtone);
      const timeString = new Date(triggerTime).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
      });
      Alert.alert(
        '⏰ Alarm Set',
        `We'll wake you at ${timeString} with "${RINGTONES.find((r) => r.id === selectedRingtone)?.label}".`,
      );
    } else {
      console.log('[SleepScreen] Silent session started (alarm disabled).');
    }
    startSleep();
  };
  const handleTestAlarm = () => {
    if (Platform.OS === 'android' && AlarmModule) {
      // Calculate timestamp exactly 10 seconds from right now
      const triggerTime = Date.now() + 10 * 1000; 
      // Fire the native bridge
      AlarmModule.setAlarm(triggerTime, selectedRingtone);
      Alert.alert(
        '🧪 Test Alarm Set',
        'Lock your phone screen immediately. The alarm will ring in 10 seconds.'
      );
    } else {
      Alert.alert('Error', 'AlarmModule is not accessible on this device.');
    }
  };
  const handleStopSleepPress = () => {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.cancelAlarm();
    }
    setSelectedQuality(0);
    setSelectedMood(null);
    setShowWakeCheckIn(true);
  };
  const handleConfirmWakeCheckIn = () => {
    if (selectedQuality === 0) {
      Alert.alert('Rate your sleep', 'Please select a star rating before continuing.');
      return;
    }
    stopSleep(selectedQuality, selectedMood);
    setShowWakeCheckIn(false);
  };
  const handleSkipWakeCheckIn = () => {
    stopSleep(null, null);
    setShowWakeCheckIn(false);
  };
  const handleGoalEditorOpen = () => { setTempGoalHours(sleepGoalHours || 8); setShowGoalEditor(true); };
  const handleGoalEditorSave = () => { setSleepGoalHours(Math.max(1, Number(tempGoalHours) || 8)); setShowGoalEditor(false); };
  const handlePremiumTeasePress = () => Alert.alert('Premium Feature', 'Advanced sleep stage analysis is a Premium feature.');
  const currentRingtoneName = RINGTONES.find((r) => r.id === selectedRingtone)?.label ?? '—';
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.sessionCard, { backgroundColor: COLORS.card }]}>
          <View style={styles.sessionTopRow}>
            <View>
              <Text style={[styles.sessionLabel, { color: COLORS.primary }]}>CURRENT SESSION</Text>
              <Text style={[styles.sessionTitle, { color: COLORS.primary }]}>
                {isSleeping ? 'Tracking Sleep' : 'Ready for Bed'}
              </Text>
            </View>
            <View style={[styles.trackingBadge, { backgroundColor: COLORS.card }]}>
              <View style={[styles.trackingDot, { backgroundColor: isSleeping ? COLORS.error : COLORS.success }]} />
              <Text style={[styles.trackingBadgeText, { color: COLORS.primary }]}>
                {isSleeping ? 'Active' : 'Ready'}
              </Text>
            </View>
          </View>
          <View style={styles.progressRingWrap}>
            <CircularProgress
              value={isSleeping ? sessionHours : 0}
              maxValue={targetHours}
              radius={100}
              activeStrokeColor={COLORS.sleep}
              inActiveStrokeColor={COLORS.border}
              activeStrokeWidth={12}
              inActiveStrokeWidth={12}
              showProgressValue={false}
            />
            <View style={styles.progressTextWrap}>
              <Text style={[styles.progressDuration, FONTS.mediumNumbers, { color: COLORS.sleep }]}>
                {sessionDurationText}
              </Text>
              <Text style={[styles.progressCaption, FONTS.smallText, { color: COLORS.primary }]}>
                remaining
              </Text>
            </View>
          </View>
          {!isSleeping && (
            <View
              style={[
                styles.alarmToggleRow,
                {
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                },
              ]}
            >
              <View style={styles.alarmToggleLeft}>
                <Ionicons
                  name={isAlarmEnabled ? 'alarm-outline' : 'alarm-off-outline'}
                  size={20}
                  color={isAlarmEnabled ? COLORS.sleep : COLORS.textMuted}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.alarmToggleLabel, { color: COLORS.textPrimary }]}>
                    Wake-up Alarm
                  </Text>
                  <Text style={[styles.alarmToggleSub, { color: COLORS.textMuted }]}>
                    {isAlarmEnabled
                      ? `Rings after ${Math.floor(targetHours)}h`
                      : 'Alarm off — silent session'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAlarmEnabled}
                onValueChange={setIsAlarmEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.sleep + '55' }}
                thumbColor={isAlarmEnabled ? COLORS.sleep : COLORS.textMuted}
              />
            </View>
          )}
          {!isSleeping && isAlarmEnabled && (
            <TouchableOpacity
              style={[
                styles.ringtoneTrigger,
                { backgroundColor: COLORS.card },
              ]}
              activeOpacity={0.8}
              onPress={() => setShowRingtonePicker(true)}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: COLORS.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="musical-notes-outline" size={18} color={COLORS.sleep} />
              </View>
              <Text style={[styles.ringtoneTriggerText, { color: COLORS.textPrimary, flex: 1, marginLeft: 12 }]}>
                {currentRingtoneName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <View style={styles.sessionButtonRow}>
            <TouchableOpacity
              style={[
                styles.primarySessionButton,
                { backgroundColor: isSleeping ? COLORS.error : COLORS.primary, width: '100%' },
              ]}
              activeOpacity={0.9}
              onPress={isSleeping ? handleStopSleepPress : handleStartSleep}
            >
              <Ionicons
                name={isSleeping ? 'stop-circle-outline' : 'play-circle-outline'}
                size={20}
                color={COLORS.onPrimary}
              />
              <Text style={[styles.primarySessionButtonText, FONTS.buttonText, { color: COLORS.onPrimary }]}>
                {isSleeping ? 'End Sleep Session' : 'Start Sleep Session'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sessionMeta, FONTS.smallText, { color: 'rgba(255,255,255,0.7)' }]}>
            {isSleeping
              ? `Elapsed ${elapsedTime.split(':').slice(0, 2).join(':')} • Target: ${Math.floor(targetHours)}h`
              : `Goal: ${Math.floor(targetHours)}h • Suggested bedtime: ${suggestedBedtime}`}
          </Text>
        </View>
        {!isSleeping && (
             <TouchableOpacity 
               style={{ marginTop: 10, padding: 12, backgroundColor: '#333', borderRadius: 10, alignItems: 'center' }}
               onPress={handleTestAlarm}
             >
               <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🧪 TEST ALARM (10 SECONDS)</Text>
             </TouchableOpacity>
          )}
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
        <View style={[styles.weekCard, { backgroundColor: COLORS.card, ...SHADOWS.small }]}>
          <Text style={[styles.weekTitle, { color: COLORS.textPrimary }]}>This Week</Text>
          {weekSummary.nightsLogged === 0 ? (
            <Text style={[styles.weekEmpty, { color: COLORS.textMuted }]}>
              No sleep sessions logged yet. Start tracking tonight!
            </Text>
          ) : (
            <View style={styles.weekStatsRow}>
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatValue, { color: COLORS.textPrimary }]}>{weekSummary.avgHours}h</Text>
                <Text style={[styles.weekStatLabel, { color: COLORS.textMuted }]}>Avg / night</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatValue, { color: weekSummary.debtHours > 2 ? '#DC2626' : COLORS.textPrimary }]}>
                  {weekSummary.debtHours}h
                </Text>
                <Text style={[styles.weekStatLabel, { color: COLORS.textMuted }]}>Sleep debt</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStat}>
                <Text style={[styles.weekStatValue, { color: COLORS.textPrimary }]}>
                  {weekSummary.avgQuality > 0 ? `${weekSummary.avgQuality}★` : '—'}
                </Text>
                <Text style={[styles.weekStatLabel, { color: COLORS.textMuted }]}>Avg quality</Text>
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.advancedCard, { backgroundColor: COLORS.card, ...SHADOWS.small, marginTop: 16 }]}
          activeOpacity={0.85}
          onPress={!isPremiumUser ? handlePremiumTeasePress : undefined}
        >
          <View style={[styles.metricIconBox, { backgroundColor: COLORS.secondaryContainer }]}>
            <Ionicons name="pulse-outline" size={20} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.metricHeading, { color: COLORS.textPrimary }]}>Sleep Stage Analysis</Text>
            <Text style={[styles.metricBody, { color: COLORS.textMuted }]}>
              {isPremiumUser ? 'Deep, REM and light sleep breakdown' : 'Unlock with Premium'}
            </Text>
          </View>
          {!isPremiumUser && <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />}
        </TouchableOpacity>
        <Text style={[styles.historyTitle, { color: COLORS.textPrimary }]}>Recent Nights</Text>
        {(sleepHistory || []).slice(0, 7).map((entry) => {
          const hasQuality = typeof entry.qualityStars === 'number' && entry.qualityStars > 0;
          const qualityMeta = hasQuality ? getQualityMeta(entry.qualityStars) : null;
          const moodMeta = entry.mood ? MOODS.find((m) => m.key === entry.mood) : null;
          return (
            <View key={entry.id} style={[styles.historyRow, { backgroundColor: COLORS.card, ...SHADOWS.small }]}>
              <View>
                <Text style={[styles.historyDate, { color: COLORS.textPrimary }]}>{entry.date}</Text>
                <Text style={[styles.historyDuration, { color: COLORS.textMuted }]}>{entry.duration}h slept</Text>
              </View>
              <View style={styles.historyRight}>
                {moodMeta && <Text style={styles.historyMoodEmoji}>{moodMeta.emoji}</Text>}
                {hasQuality ? (
                  <View style={[styles.qualityBadge, { backgroundColor: qualityMeta.bg }]}>
                    <Text style={[styles.qualityBadgeText, { color: qualityMeta.color }]}>
                      {'★'.repeat(entry.qualityStars)}{'☆'.repeat(5 - entry.qualityStars)}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.qualityBadge, { backgroundColor: COLORS.border }]}>
                    <Text style={[styles.qualityBadgeText, { color: COLORS.textMuted }]}>Not rated</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {(sleepHistory || []).length === 0 && (
          <Text style={[styles.weekEmpty, { color: COLORS.textMuted, marginTop: 8 }]}>
            Your sleep history will appear here after your first session.
          </Text>
        )}
        <Modal
          visible={showGoalEditor}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGoalEditor(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Edit Sleep Goal</Text>
              <View style={styles.sliderContainer}>
                <Text style={[FONTS.mediumNumbers, { color: COLORS.primary }]}>{tempGoalHours}h</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
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
                  onPress={() => setShowGoalEditor(false)}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  activeOpacity={0.8}
                  onPress={handleGoalEditorSave}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.onPrimary || '#FFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showRingtonePicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (Platform.OS === 'android' && AlarmModule) {
              AlarmModule.stopPreview();
            }
            setShowRingtonePicker(false);
          }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }]}>
            <View style={[styles.bottomSheet, { backgroundColor: COLORS.card }]}>
              <View style={styles.bottomSheetHandle} />
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary, marginBottom: 16 }]}>
                🎵 Choose Ringtone
              </Text>
              {RINGTONES.map((tone) => (
                <TouchableOpacity
                  key={tone.id}
                  style={[
                    styles.ringtoneRow,
                    {
                      backgroundColor:
                        selectedRingtone === tone.id ? COLORS.primaryContainer : 'transparent',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    // 1. Update the UI state
                    setSelectedRingtone(tone.id);
                    // 2. Trigger the native audio preview
                    if (Platform.OS === 'android' && AlarmModule) {
                      AlarmModule.playPreview(tone.id);
                    }
                  }}
                >
                  <Text style={[styles.ringtoneName, { color: COLORS.textPrimary }]}>{tone.label}</Text>
                  {selectedRingtone === tone.id && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.primary, marginTop: 16 }]}
                activeOpacity={0.8}
                onPress={() => {
                  // Stop the audio preview when confirming the selection
                  if (Platform.OS === 'android' && AlarmModule) {
                    AlarmModule.stopPreview();
                  }
                  setShowRingtonePicker(false);
                }}
              >
                <Text style={[FONTS.buttonText, { color: COLORS.onPrimary || '#FFF' }]}>Confirm & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showWakeCheckIn}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWakeCheckIn(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Good morning! ☀️</Text>
              <Text style={[styles.modalSubtitle, { color: COLORS.textMuted }]}>How did you sleep?</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSelectedQuality(star)}
                    activeOpacity={0.7}
                    style={styles.starTouchable}
                  >
                    <Ionicons
                      name={star <= selectedQuality ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= selectedQuality ? '#FBBF24' : COLORS.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {selectedQuality > 0 && (
                <Text style={[styles.qualityPreviewText, { color: getQualityMeta(selectedQuality).color }]}>
                  {getQualityMeta(selectedQuality).label}
                </Text>
              )}
              <Text style={[styles.modalSubtitle, { color: COLORS.textMuted, marginTop: 20 }]}>
                How do you feel?
              </Text>
              <View style={styles.moodRow}>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood.key}
                    onPress={() => setSelectedMood(mood.key)}
                    activeOpacity={0.7}
                    style={[
                      styles.moodTouchable,
                      selectedMood === mood.key && {
                        backgroundColor: COLORS.primaryContainer,
                        borderRadius: 12,
                      },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.modalButtonRow, { marginTop: 24 }]}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.border }]}
                  activeOpacity={0.8}
                  onPress={handleSkipWakeCheckIn}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.textPrimary }]}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  activeOpacity={0.8}
                  onPress={handleConfirmWakeCheckIn}
                >
                  <Text style={[FONTS.buttonText, { color: COLORS.onPrimary || '#FFF' }]}>Save</Text>
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
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  sessionCard: { borderRadius: 20, padding: 16, marginBottom: 16 },
  sessionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sessionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' },
  sessionTitle: { fontSize: 30, fontWeight: '800', lineHeight: 40 },
  trackingBadge: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  trackingDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  trackingBadgeText: { fontSize: 14, fontWeight: '700' },
  progressRingWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  progressTextWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressDuration: { fontSize: 32, fontWeight: '800', lineHeight: 38, textAlign: 'center' },
  progressCaption: { marginTop: 4, fontSize: 13, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  alarmToggleRow: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  alarmToggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  alarmToggleLabel: { fontSize: 15, fontWeight: '700' },
  alarmToggleSub: { fontSize: 12, marginTop: 2 },
  ringtoneTrigger: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, gap: 10 },
  ringtoneTriggerText: { flex: 1, fontSize: 14, fontWeight: '600' },
  sessionButtonRow: { marginTop: 4, flexDirection: 'row', gap: 12 },
  primarySessionButton: { flex: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primarySessionButtonText: { fontSize: 16, fontWeight: '700' },
  sessionMeta: { marginTop: 16, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  metricCard: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, elevation: 2 },
  metricIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricMainValue: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  metricHeading: { marginTop: 4, fontSize: 16, fontWeight: '700' },
  metricBody: { marginTop: 4, fontSize: 12 },
  weekCard: { borderRadius: 16, padding: 16 },
  weekTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  weekEmpty: { fontSize: 13, lineHeight: 20 },
  weekStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatValue: { fontSize: 22, fontWeight: '800' },
  weekStatLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  weekStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(150,150,150,0.2)' },
  advancedCard: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  historyTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  historyRow: { borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyDate: { fontSize: 15, fontWeight: '700' },
  historyDuration: { fontSize: 12, marginTop: 2 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyMoodEmoji: { fontSize: 22 },
  qualityBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  qualityBadgeText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 20, padding: 24, width: '88%', elevation: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, fontWeight: '600' },
  sliderContainer: { marginBottom: 24, marginTop: 16 },
  slider: { width: '100%', height: 40, marginVertical: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 0, width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, width: '100%' },
  bottomSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.35)', alignSelf: 'center', marginBottom: 16 },
  ringtoneRow: { borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, marginBottom: 4 },
  ringtoneName: { fontSize: 16, fontWeight: '600' },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 },
  starTouchable: { padding: 4 },
  qualityPreviewText: { textAlign: 'center', fontSize: 14, fontWeight: '800', marginTop: 8 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  moodTouchable: { padding: 8, alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  moodEmoji: { fontSize: 28 },
});