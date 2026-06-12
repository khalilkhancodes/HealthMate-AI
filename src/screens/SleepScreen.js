import Ionicons from '@expo/vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

// ─────────────────────────────────────────────────────────────────────────────
// SleepScreen — redesigned
//
// WHAT'S NEW:
// 1. Wake-up flow: when user taps "End Sleep Session", a modal appears asking
//    for a 1-5 star QUALITY rating and a 5-emoji MOOD rating, BEFORE saving.
// 2. These are passed to stopSleep(quality, mood) — see useHealthStore changes
//    needed below.
// 3. Sleep History section now shows quality stars + mood emoji per entry,
//    replacing the old text-only "Good/Fair/Poor" badge.
// 4. Quality Score / Breaths-per-min premium cards are REMOVED — they were
//    fake placeholder numbers (Math.round(55 + ...)) with no real backing
//    data. Replaced with a real "This Week" sleep debt summary card that
//    uses actual logged data.
// 5. Bedtime reminder hint added near the goal card (actual scheduling logic
//    lives in your notifications util — this just surfaces the goal-based
//    suggested bedtime).
// ─────────────────────────────────────────────────────────────────────────────

const MOODS = [
  { key: 'exhausted', emoji: '😫', label: 'Exhausted' },
  { key: 'tired', emoji: '😔', label: 'Tired' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'great', emoji: '🤩', label: 'Great' },
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

// Quality label/colour helper — used both in the wake-up modal preview
// and in the history list.
function getQualityMeta(stars) {
  if (stars >= 5) return { label: 'Excellent', color: '#16A34A', bg: '#DCFCE7' };
  if (stars >= 4) return { label: 'Good', color: '#16A34A', bg: '#DCFCE7' };
  if (stars >= 3) return { label: 'Fair', color: '#D97706', bg: '#FEF3C7' };
  if (stars >= 2) return { label: 'Poor', color: '#EA580C', bg: '#FFEDD5' };
  return { label: 'Very Poor', color: '#DC2626', bg: '#FEE2E2' };
}

export default function SleepScreen() {
  const { COLORS, FONTS, RADII, SHADOWS } = useTheme();

  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState(8);
  const [nowMs, setNowMs] = useState(Date.now());

  // ── Wake-up check-in modal state ──────────────────────────────────────────
  const [showWakeCheckIn, setShowWakeCheckIn] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(0); // 1-5 stars
  const [selectedMood, setSelectedMood] = useState(null);     // mood key

  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);
  const isSleeping = useHealthStore((state) => state.isSleeping);
  const sleepStartTime = useHealthStore((state) => state.sleepStartTime);
  const startSleep = useHealthStore((state) => state.startSleep);
  const stopSleep = useHealthStore((state) => state.stopSleep);
  const sleepGoalHours = useHealthStore((state) => state.sleepGoalHours);
  const setSleepGoalHours = useHealthStore((state) => state.setSleepGoalHours);
  const sleepHistory = useHealthStore((state) => state.sleepHistory);

  const targetHours = Math.max(1, sleepGoalHours || 8);

  const sessionHours = useMemo(() => {
    if (!isSleeping || !sleepStartTime) return 0;
    return (nowMs - sleepStartTime) / (1000 * 60 * 60);
  }, [isSleeping, sleepStartTime, nowMs]);

  const remainingMs = useMemo(() => {
    if (!isSleeping || !sleepStartTime) return targetHours * 60 * 60 * 1000;
    const elapsed = nowMs - sleepStartTime;
    return Math.max(0, targetHours * 60 * 60 * 1000 - elapsed);
  }, [isSleeping, targetHours, sleepStartTime, nowMs]);

  const sessionDurationText = useMemo(() => {
    if (!isSleeping) {
      const hours = Math.floor(targetHours);
      const mins = Math.round((targetHours - hours) * 60);
      return `${hours}h ${String(mins).padStart(2, '0')}m`;
    }
    return formatRemainingTime(remainingMs);
  }, [isSleeping, targetHours, remainingMs]);

  useEffect(() => {
    if (!isSleeping || !sleepStartTime) {
      setElapsedTime('00:00:00');
      return;
    }
    const timer = setInterval(() => {
      setElapsedTime(formatElapsedTime(Date.now() - sleepStartTime));
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isSleeping, sleepStartTime]);

  // ── This week's sleep debt summary (real data, replaces fake premium cards) ─
  const weekSummary = useMemo(() => {
    const last7 = (sleepHistory || []).slice(0, 7);
    if (last7.length === 0) {
      return { avgHours: 0, debtHours: 0, nightsLogged: 0, avgQuality: 0 };
    }
    const totalHours = last7.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalDebt = last7.reduce((sum, e) => sum + Math.max(0, targetHours - (e.duration || 0)), 0);
    const qualityEntries = last7.filter((e) => typeof e.qualityStars === 'number');
    const avgQuality = qualityEntries.length
      ? qualityEntries.reduce((s, e) => s + e.qualityStars, 0) / qualityEntries.length
      : 0;

    return {
      avgHours: Number((totalHours / last7.length).toFixed(1)),
      debtHours: Number(totalDebt.toFixed(1)),
      nightsLogged: last7.length,
      avgQuality: Number(avgQuality.toFixed(1)),
    };
  }, [sleepHistory, targetHours]);

  // Suggested bedtime so user wakes up at their goal — simple "now + 8h" style hint
  const suggestedBedtime = useMemo(() => {
    const wakeTarget = new Date();
    wakeTarget.setHours(7, 0, 0, 0); // assume 7am wake target; could be made configurable
    const bedtime = new Date(wakeTarget.getTime() - targetHours * 60 * 60 * 1000);
    return bedtime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [targetHours]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePremiumTeasePress = () => {
    Alert.alert('Premium Feature', 'Advanced sleep stage analysis is a Premium feature.');
  };

  const handleStartSleep = () => {
    startSleep();
    console.log('[SleepScreen] Sleep tracking started manually.');
  };

  // Instead of stopping immediately, open the wake-up check-in modal first.
  const handleStopSleepPress = () => {
    setSelectedQuality(0);
    setSelectedMood(null);
    setShowWakeCheckIn(true);
  };

  // Called when user confirms quality + mood in the wake-up modal.
  const handleConfirmWakeCheckIn = () => {
    if (selectedQuality === 0) {
      Alert.alert('Rate your sleep', 'Please select a star rating before continuing.');
      return;
    }
    // stopSleep now accepts quality (1-5) and mood (string key).
    // See useHealthStore update notes below this file.
    stopSleep(selectedQuality, selectedMood);
    setShowWakeCheckIn(false);
    console.log('[SleepScreen] Sleep stopped with quality:', selectedQuality, 'mood:', selectedMood);
  };

  const handleSkipWakeCheckIn = () => {
    // Still stop the session, just without quality/mood data
    stopSleep(null, null);
    setShowWakeCheckIn(false);
  };

  const handleGoalEditorSave = () => {
    const nextGoal = Math.max(1, Number(tempGoalHours) || 8);
    setSleepGoalHours(nextGoal);
    setShowGoalEditor(false);
  };

  const handleGoalEditorOpen = () => {
    setTempGoalHours(sleepGoalHours || 8);
    setShowGoalEditor(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Current session card ──────────────────────────────────────── */}
        <View style={[styles.sessionCard, { backgroundColor: COLORS.surface, ...SHADOWS.small }]}>
          <View style={styles.sessionTopRow}>
            <View>
              <Text style={styles.sessionLabel}>CURRENT SESSION</Text>
              <Text style={[styles.sessionTitle, { color: COLORS.onPrimary }]}>
                {isSleeping ? 'Tracking Sleep' : 'Ready for Bed'}
              </Text>
            </View>

            <View style={styles.trackingBadge}>
              <View style={[styles.trackingDot, { backgroundColor: isSleeping ? COLORS.error : COLORS.success }]} />
              <Text style={[styles.trackingBadgeText, { color: COLORS.onPrimary }]}>
                {isSleeping ? 'Active' : 'Ready'}
              </Text>
            </View>
          </View>

          <View style={styles.progressRingWrap}>
            <CircularProgress
              value={isSleeping ? sessionHours : 0}
              maxValue={targetHours}
              radius={100}
              activeStrokeColor={COLORS.onPrimary || '#FFFFFF'}
              inActiveStrokeColor={'rgba(255,255,255,0.2)'}
              activeStrokeWidth={12}
              inActiveStrokeWidth={12}
              showProgressValue={false}
            />
            <View style={styles.progressTextWrap}>
              <Text style={[styles.progressDuration, FONTS.mediumNumbers, { color: COLORS.onPrimary }]}>
                {sessionDurationText}
              </Text>
              <Text style={[styles.progressCaption, FONTS.smallText, { color: 'rgba(255,255,255,0.7)' }]}>
                remaining
              </Text>
            </View>
          </View>

          <View style={styles.sessionButtonRow}>
            <TouchableOpacity
              style={[styles.primarySessionButton, { backgroundColor: isSleeping ? COLORS.error : COLORS.primary, width: '100%' }]}
              activeOpacity={0.9}
              onPress={isSleeping ? handleStopSleepPress : handleStartSleep}
            >
              <Ionicons name={isSleeping ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color={COLORS.onPrimary} />
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

        {/* ── Goal card ──────────────────────────────────────────────────── */}
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

        {/* ── This Week summary (real data) ─────────────────────────────── */}
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
                <Text style={[
                  styles.weekStatValue,
                  { color: weekSummary.debtHours > 2 ? '#DC2626' : COLORS.textPrimary }
                ]}>
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

        {/* ── Premium advanced analysis teaser ──────────────────────────── */}
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

        {/* ── Sleep history with quality + mood ─────────────────────────── */}
        <Text style={[styles.historyTitle, { color: COLORS.textPrimary }]}>Recent Nights</Text>

        {(sleepHistory || []).slice(0, 7).map((entry) => {
          const hasQuality = typeof entry.qualityStars === 'number' && entry.qualityStars > 0;
          const qualityMeta = hasQuality ? getQualityMeta(entry.qualityStars) : null;
          const moodMeta = entry.mood ? MOODS.find((m) => m.key === entry.mood) : null;

          return (
            <View key={entry.id} style={[styles.historyRow, { backgroundColor: COLORS.card, ...SHADOWS.small }]}>
              <View style={styles.historyLeft}>
                <Text style={[styles.historyDate, { color: COLORS.textPrimary }]}>{entry.date}</Text>
                <Text style={[styles.historyDuration, { color: COLORS.textMuted }]}>{entry.duration}h slept</Text>
              </View>

              <View style={styles.historyRight}>
                {moodMeta && (
                  <Text style={styles.historyMoodEmoji}>{moodMeta.emoji}</Text>
                )}
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

        {/* ── Goal editor modal (unchanged) ─────────────────────────────── */}
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

        {/* ── NEW: Wake-up check-in modal (quality + mood) ───────────────── */}
        <Modal
          visible={showWakeCheckIn}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWakeCheckIn(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.card }]}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Good morning! ☀️</Text>
              <Text style={[styles.modalSubtitle, { color: COLORS.textMuted }]}>
                How did you sleep?
              </Text>

              {/* Star rating */}
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

              {/* Mood selector */}
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

  // Session card
  sessionCard: { borderRadius: 20, padding: 16, marginBottom: 16 },
  sessionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sessionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.75)' },
  sessionTitle: { fontSize: 30, fontWeight: '800', lineHeight: 40 },
  trackingBadge: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  trackingDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  trackingBadgeText: { fontSize: 14, fontWeight: '700' },
  progressRingWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  progressTextWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressDuration: { fontSize: 32, fontWeight: '800', lineHeight: 38, textAlign: 'center' },
  progressCaption: { marginTop: 4, fontSize: 13, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  sessionButtonRow: { marginTop: 12, flexDirection: 'row', gap: 12 },
  primarySessionButton: { flex: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primarySessionButtonText: { fontSize: 16, fontWeight: '700' },
  sessionMeta: { marginTop: 16, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Goal / metric card (single, used for the goal tile)
  metricCard: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  metricIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricMainValue: { fontSize: 34, fontWeight: '800', lineHeight: 40 },
  metricHeading: { marginTop: 4, fontSize: 16, fontWeight: '700' },
  metricBody: { marginTop: 4, fontSize: 12 },

  // This week summary card
  weekCard: { borderRadius: 16, padding: 16 },
  weekTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  weekEmpty: { fontSize: 13, lineHeight: 20 },
  weekStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatValue: { fontSize: 22, fontWeight: '800' },
  weekStatLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  weekStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(150,150,150,0.2)' },

  // Advanced (premium) teaser card
  advancedCard: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },

  // Sleep history
  historyTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  historyRow: { borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyLeft: {},
  historyDate: { fontSize: 15, fontWeight: '700' },
  historyDuration: { fontSize: 12, marginTop: 2 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyMoodEmoji: { fontSize: 22 },
  qualityBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  qualityBadgeText: { fontSize: 12, fontWeight: '700' },

  // Modals (shared)
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 20, padding: 24, width: '88%', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, fontWeight: '600' },
  sliderContainer: { marginBottom: 24, marginTop: 16 },
  slider: { width: '100%', height: 40, marginVertical: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },

  // Wake-up check-in specific
  starRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 4 },
  starTouchable: { padding: 4 },
  qualityPreviewText: { textAlign: 'center', fontSize: 14, fontWeight: '800', marginTop: 8 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  moodTouchable: { padding: 8, alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  moodEmoji: { fontSize: 28 },
});