import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy'; // FIXED: SDK 54 Legacy Import
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

const TIMEFRAMES = ['Weekly', 'Monthly', 'Yearly'];
const METRICS = ['steps', 'water', 'sleep'];
const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const METRIC_CONFIG = {
  steps: { icon: 'footsteps', accent: '#4ADE80', label: 'Steps',     unit: 'steps/day'   },
  water: { icon: 'water',     accent: '#4AA9FF', label: 'Hydration', unit: 'litres/day'  },
  sleep: { icon: 'moon',      accent: '#FF9A4D', label: 'Sleep',     unit: 'hours/night' },
};

// ─── Pure helpers ──────────────────────────────────────────────────────────────
const getDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, amount) => { const n = new Date(date); n.setDate(n.getDate() + amount); return n; };
const safeNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const average = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const standardDeviation = (arr) => {
  if (!arr.length) return 0;
  const avg = average(arr);
  return Math.sqrt(average(arr.map((v) => (v - avg) ** 2)));
};
const formatTrend = (value, suffix = '%') => {
  if (!Number.isFinite(value)) return `0${suffix}`;
  const r = Math.round(value);
  return `${r > 0 ? '+' : ''}${r}${suffix}`;
};
const formatMetricValue = (metric, value) => {
  if (metric === 'steps') return Math.round(value).toLocaleString();
  if (metric === 'water') return `${value.toFixed(1)}L`;
  return `${value.toFixed(1)}h`;
};
const formatYAxisLabel = (value, metric) => {
  const n = Number(value);
  if (n === 0) return '0';
  if (metric === 'steps') { const s = n / 1000; return s % 1 === 0 ? `${Math.round(s)}k` : `${s.toFixed(1)}k`; }
  if (metric === 'water') return `${n.toFixed(1)}L`;
  return `${n.toFixed(1)}h`;
};

// ─── Bucket builders ─────────────────────────────────────────────────────────
const extractDailySeries = (historyLogs, metric, transform = (v) => v) =>
  Object.entries(historyLogs || {})
    .map(([dateKey, values]) => ({ dateKey, date: new Date(`${dateKey}T00:00:00`), value: transform(safeNumber(values?.[metric])) }))
    .filter((e) => !Number.isNaN(e.date.getTime()))
    .sort((a, b) => a.date - b.date);

const buildBuckets = (source, timeframe, offset = 0) => {
  const sorted = [...source].sort((a, b) => a.date - b.date);
  const now = toStartOfDay(new Date());

  if (timeframe === 'Weekly') {
    const rangeEnd = addDays(now, -offset * 7);
    const rangeStart = addDays(rangeEnd, -6);
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(rangeStart, i);
      const dayKey = getDateKey(day);
      const values = sorted.filter((item) => item.dateKey === dayKey).map((item) => item.value);
      return { label: day.toLocaleDateString([], { weekday: 'short' }), tooltipLabel: DATE_FMT.format(day), dateKey: dayKey, value: values.length ? average(values) : 0 };
    });
    return { buckets, periodLabel: `${DATE_FMT.format(rangeStart)} – ${DATE_FMT.format(rangeEnd)}` };
  }
  if (timeframe === 'Monthly') {
    const rangeEnd = addDays(now, -offset * 28);
    const rangeStart = addDays(rangeEnd, -27);
    const buckets = Array.from({ length: 4 }, (_, i) => {
      const bucketStart = addDays(rangeStart, i * 7);
      const bucketEnd = addDays(bucketStart, 6);
      const values = sorted.filter((item) => item.date >= bucketStart && item.date <= bucketEnd).map((item) => item.value);
      return { label: `W${i + 1}`, tooltipLabel: `${DATE_FMT.format(bucketStart)} • ${DATE_FMT.format(bucketEnd)}`, dateKey: getDateKey(bucketStart), value: values.length ? average(values) : 0 };
    });
    return { buckets, periodLabel: `${DATE_FMT.format(rangeStart)} – ${DATE_FMT.format(rangeEnd)}` };
  }
  const year = new Date().getFullYear() - offset;
  const buckets = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);
    const values = sorted.filter((item) => item.date >= monthStart && item.date <= monthEnd).map((item) => item.value);
    return { label: monthStart.toLocaleDateString([], { month: 'short' }).charAt(0), tooltipLabel: monthStart.toLocaleDateString([], { month: 'long' }), dateKey: getDateKey(monthStart), value: values.length ? average(values) : 0 };
  });
  return { buckets, periodLabel: `${year}` };
};

const buildInsight = ({ metric, timeframe, buckets, previousBuckets }) => {
  const currentValues = buckets.map((b) => b.value);
  const previousValues = previousBuckets.map((b) => b.value);
  const bestBucket = buckets.reduce((best, b) => (b.value > (best?.value ?? -Infinity) ? b : best), null);
  const currentAverage = average(currentValues);
  const previousAverage = average(previousValues);
  const currentConsistency = Math.max(0, Math.round((1 - Math.min(standardDeviation(currentValues) / Math.max(currentAverage, 1), 1)) * 100));
  const previousConsistency = Math.max(0, Math.round((1 - Math.min(standardDeviation(previousValues) / Math.max(previousAverage, 1), 1)) * 100));
  const consistencyDelta = currentConsistency - previousConsistency;
  const trendDelta = previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : currentAverage > 0 ? 100 : 0;
  if (!bestBucket) return 'Start logging data to unlock personalized insights.';
  if (metric === 'water') {
    if (timeframe === 'Monthly') return `Your hydration peaked in ${bestBucket.tooltipLabel} with a daily average of ${currentAverage.toFixed(1)}L. You are ${Math.abs(Math.round(consistencyDelta))}% ${consistencyDelta >= 0 ? 'more' : 'less'} consistent this month.`;
    if (timeframe === 'Yearly') return `Your strongest hydration month was ${bestBucket.tooltipLabel} at ${currentAverage.toFixed(1)}L/day. That is ${formatTrend(trendDelta)} versus the previous year.`;
    return `You averaged ${currentAverage.toFixed(1)}L/day this week, with ${bestBucket.label} as your strongest day. Current consistency is ${currentConsistency}%.`;
  }
  if (metric === 'steps') {
    if (timeframe === 'Monthly') return `Your activity peaked in ${bestBucket.tooltipLabel} at ${Math.round(bestBucket.value).toLocaleString()} steps/day. You are ${formatTrend(trendDelta)} more active than the previous month.`;
    if (timeframe === 'Yearly') return `Your strongest month was ${bestBucket.tooltipLabel} with an average of ${Math.round(bestBucket.value).toLocaleString()} steps/day. Trend versus the previous year: ${formatTrend(trendDelta)}.`;
    return `You averaged ${Math.round(currentAverage).toLocaleString()} steps/day this week. ${bestBucket.label} was your best day, and momentum is ${formatTrend(trendDelta)}.`;
  }
  if (timeframe === 'Monthly') return `Your sleep peaked in ${bestBucket.tooltipLabel} with a daily average of ${currentAverage.toFixed(1)}h. You are ${formatTrend(consistencyDelta)} more consistent this month.`;
  if (timeframe === 'Yearly') return `Your strongest sleep month was ${bestBucket.tooltipLabel} at ${currentAverage.toFixed(1)}h/night. Trend versus the previous year: ${formatTrend(trendDelta)}.`;
  return `You averaged ${currentAverage.toFixed(1)}h/night this week, with ${bestBucket.label} as your best night.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function saveToDownloads(fileUri, filename, mimeType) {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') {
    try {
      if (FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            mimeType
          );
          await FileSystem.writeAsStringAsync(newUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert('Saved', `${filename} has been saved to the selected folder.`);
          return true;
        }
      }
    } catch (err) {
      console.warn('[Export] StorageAccessFramework save failed, falling back to share:', err);
    }
  }

  await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Save or share ${filename}` });
  return false;
}

function buildPdfHtml({ historyLogs, exportIncludes, generatedOn }) {
  const dates = Object.keys(historyLogs || {}).sort().reverse().slice(0, 30);

  const stepVals = dates.map((d) => historyLogs[d]?.steps || 0);
  const waterVals = dates.map((d) => (historyLogs[d]?.water || 0) / 1000);
  const sleepVals = dates.map((d) => historyLogs[d]?.sleep || 0);
  const avgSteps = Math.round(average(stepVals));
  const avgWater = average(waterVals).toFixed(1);
  const avgSleep = average(sleepVals).toFixed(1);

  const summaryCards = [
    exportIncludes.steps ? `<div class="metric-card steps-card"><div class="metric-icon">👟</div><div class="metric-value">${avgSteps.toLocaleString()}</div><div class="metric-label">Avg daily steps</div></div>` : '',
    exportIncludes.water ? `<div class="metric-card water-card"><div class="metric-icon">💧</div><div class="metric-value">${avgWater}L</div><div class="metric-label">Avg daily water</div></div>` : '',
    exportIncludes.sleep ? `<div class="metric-card sleep-card"><div class="metric-icon">🌙</div><div class="metric-value">${avgSleep}h</div><div class="metric-label">Avg nightly sleep</div></div>` : '',
  ].join('');

  const tableHeaders = [
    '<th>Date</th>',
    exportIncludes.steps ? '<th>Steps</th>' : '',
    exportIncludes.water ? '<th>Water</th>' : '',
    exportIncludes.sleep ? '<th>Sleep</th>' : '',
  ].join('');

  const tableRows = dates.map((date, i) => {
    const log = historyLogs[date] || {};
    const steps = (log.steps || 0).toLocaleString();
    const water = `${((log.water || 0) / 1000).toFixed(1)}L`;
    const sleep = `${log.sleep || 0}h`;
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr style="background:${rowBg}">
      <td>${date}</td>
      ${exportIncludes.steps ? `<td>${steps}</td>` : ''}
      ${exportIncludes.water ? `<td>${water}</td>` : ''}
      ${exportIncludes.sleep ? `<td>${sleep}</td>` : ''}
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #0f172a; }

  .header {
    background: linear-gradient(135deg, #447055 0%, #2d5c3f 100%);
    padding: 40px 40px 32px;
    color: white;
  }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .app-name { font-size: 13px; font-weight: 700; letter-spacing: 2px; opacity: 0.7; text-transform: uppercase; }
  .report-title { font-size: 32px; font-weight: 800; margin-top: 8px; letter-spacing: -0.5px; }
  .report-subtitle { font-size: 15px; opacity: 0.75; margin-top: 6px; }
  .report-meta { font-size: 12px; opacity: 0.6; margin-top: 4px; }
  .header-badge { background: rgba(255,255,255,0.15); border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 700; }

  .content { padding: 32px 40px; }

  .section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 16px;
    margin-top: 32px;
  }

  .metrics-grid { display: flex; gap: 16px; margin-bottom: 8px; }
  .metric-card {
    flex: 1;
    border-radius: 16px;
    padding: 20px;
    border-left: 4px solid transparent;
  }
  .steps-card  { background: #f0fdf4; border-left-color: #4ADE80; }
  .water-card  { background: #eff6ff; border-left-color: #4AA9FF; }
  .sleep-card  { background: #fff7ed; border-left-color: #FF9A4D; }
  .metric-icon { font-size: 22px; margin-bottom: 10px; }
  .metric-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
  .metric-label { font-size: 12px; color: #64748b; margin-top: 6px; font-weight: 500; }

  .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #0f172a; }
  thead th {
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 14px 16px;
    text-align: left;
  }
  tbody td {
    padding: 12px 16px;
    font-size: 14px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  tbody tr:last-child td { border-bottom: none; }
  .table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }

  .footer {
    margin-top: 40px;
    padding: 24px 40px;
    background: #0f172a;
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-brand { color: rgba(255,255,255,0.8); font-weight: 700; font-size: 13px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <div>
      <div class="app-name">HealthMate AI</div>
      <div class="report-title">Health Report</div>
      <div class="report-subtitle">30-day analytics summary</div>
      <div class="report-meta">Generated ${generatedOn}</div>
    </div>
    <div class="header-badge">Premium</div>
  </div>
</div>

<div class="content">
  <div class="section-title">30-Day Averages</div>
  <div class="metrics-grid">${summaryCards}</div>

  <div class="divider"></div>

  <div class="section-title">Daily Log — Last 30 Days</div>
  <div class="table-wrapper">
    <table>
      <thead><tr>${tableHeaders}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</div>

<div class="footer">
  <div class="footer-brand">HealthMate AI</div>
  <div>This report is for personal health tracking only and not a medical document.</div>
</div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AnalyticsContent
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsContent() {
  const { COLORS, FONTS, SHADOWS } = useTheme(); // FIXED: Removed unused variables
  const historyLogs = useHealthStore((state) => state.historyLogs);

  const [timeframe, setTimeframe] = useState('Weekly');
  const [selectedMetric, setSelectedMetric] = useState('steps');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF Report');
  const [exportIncludes, setExportIncludes] = useState({ steps: true, water: true, sleep: true });

  const config = METRIC_CONFIG[selectedMetric];

  const heroAvgLabel = timeframe === 'Weekly' ? '7-day avg' : timeframe === 'Monthly' ? '28-day avg' : 'yearly avg';

  const waterHistory = useMemo(() => extractDailySeries(historyLogs || {}, 'water', (v) => v / 1000), [historyLogs]);
  const stepHistory = useMemo(() => extractDailySeries(historyLogs || {}, 'steps', (v) => v), [historyLogs]);
  const sleepHistory = useMemo(() => extractDailySeries(historyLogs || {}, 'sleep', (v) => v), [historyLogs]);
  const sourceSeries = useMemo(() => ({ steps: stepHistory, water: waterHistory, sleep: sleepHistory }), [stepHistory, waterHistory, sleepHistory]);

  const { current, previous } = useMemo(() => ({
    current: buildBuckets(sourceSeries[selectedMetric], timeframe, 0),
    previous: buildBuckets(sourceSeries[selectedMetric], timeframe, 1),
  }), [selectedMetric, sourceSeries, timeframe]);

  const currentValues = current.buckets.map((b) => b.value);
  const previousValues = previous.buckets.map((b) => b.value);
  const currentAverage = average(currentValues);
  const totalAccumulated = useMemo(() => currentValues.reduce((s, v) => s + v, 0), [currentValues]);
  const bestBucket = current.buckets.reduce((best, b) => (b.value > (best?.value ?? -Infinity) ? b : best), null);
  const previousAverage = average(previousValues);
  const trendDelta = previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : currentAverage > 0 ? 100 : 0;
  const trendPositive = trendDelta >= 0;

  const chartWidth = screenWidth - 32;
  const maxCurrentValue = currentValues.length ? Math.max(...currentValues) : 0;
  let chartDatasets = [{ data: currentValues.length ? currentValues : [0] }];
  if (maxCurrentValue === 0) {
    const defaultMax = selectedMetric === 'steps' ? 5000 : selectedMetric === 'water' ? 3 : 8;
    chartDatasets.push({ data: [defaultMax], color: () => 'transparent', strokeWidth: 0, withDots: false });
  }
  const chartData = { labels: current.buckets.map((b) => b.label), datasets: chartDatasets };

  const chartConfig = useMemo(() => {
    const hex = config.accent.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const labelHex = (COLORS.textMuted || '#64748B').replace('#', '');
    const lb = parseInt(labelHex, 16);
    const lr = (lb >> 16) & 255;
    const lg = (lb >> 8) & 255;
    const lbl = lb & 255;
    return {
      backgroundColor: COLORS.card,
      backgroundGradientFrom: COLORS.card,
      backgroundGradientTo: COLORS.card,
      decimalPlaces: selectedMetric === 'steps' ? 0 : 1,
      color: (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(${lr}, ${lg}, ${lbl}, ${opacity})`,
      barPercentage: 0.55,
      fillShadowGradientFrom: config.accent,
      fillShadowGradientFromOpacity: 0.9,
      fillShadowGradientTo: config.accent,
      fillShadowGradientToOpacity: 0.3,
      propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4 4' },
      propsForLabels: { fontSize: 11 },
    };
  }, [COLORS, selectedMetric, config.accent]);

  const insightText = useMemo(
    () => buildInsight({ metric: selectedMetric, timeframe, buckets: current.buckets, previousBuckets: previous.buckets }),
    [current.buckets, previous.buckets, selectedMetric, timeframe],
  );

  const toggleExportInclude = (key) => setExportIncludes((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Export handler ─────────────────────────────────────────────────────────
  const executeExport = async () => {
    const anyIncluded = Object.values(exportIncludes).some(Boolean);
    if (!anyIncluded) {
      Alert.alert('Nothing selected', 'Please select at least one metric to include.');
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (exportFormat === 'CSV Spreadsheet') {
        const headers = ['Date', exportIncludes.steps && 'Steps', exportIncludes.water && 'Water (L)', exportIncludes.sleep && 'Sleep (h)']
          .filter(Boolean)
          .join(',');

        const rows = Object.keys(historyLogs || {})
          .sort()
          .reverse()
          .map((date) => {
            const log = historyLogs[date] || {};
            const cols = [
              date,
              exportIncludes.steps  && String(log.steps || 0),
              exportIncludes.water  && ((log.water || 0) / 1000).toFixed(2),
              exportIncludes.sleep  && String(log.sleep || 0),
            ].filter(Boolean);
            return cols.join(',');
          });

        const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

        const filename = `HealthMate_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        const fileUri = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        setShowExportModal(false);
        await saveToDownloads(fileUri, filename, 'text/csv');

      } else {
        const htmlContent = buildPdfHtml({
          historyLogs,
          exportIncludes,
          generatedOn: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        });

        const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });

        const filename = `HealthMate_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        const destUri = FileSystem.cacheDirectory + filename;

        await FileSystem.copyAsync({ from: uri, to: destUri });

        setShowExportModal(false);
        await saveToDownloads(destUri, filename, 'application/pdf');
      }
    } catch (error) {
      console.error('[Export] Failed:', error);
      Alert.alert('Export failed', `Something went wrong: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: config.accent }]}>
              {timeframe.toUpperCase()} · {current.periodLabel}
            </Text>
            <Text style={[styles.heading, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Analytics</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportIconBtn, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
            onPress={() => setShowExportModal(true)}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, ...SHADOWS.medium }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { backgroundColor: config.accent + '22' }]}>
              <Ionicons name={config.icon} size={22} color={config.accent} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={[styles.heroLabel, { color: COLORS.textMuted }]}>
                {config.label} · {heroAvgLabel}
              </Text>
              <Text style={[styles.heroNumber, { color: COLORS.textPrimary }]}>
                {formatMetricValue(selectedMetric, currentAverage)}
              </Text>
              <Text style={[styles.heroUnit, { color: COLORS.textMuted }]}>{config.unit}</Text>
            </View>
            <View style={styles.heroTrendBlock}>
              <View style={[styles.trendPill, { backgroundColor: trendPositive ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons name={trendPositive ? 'trending-up' : 'trending-down'} size={13} color={trendPositive ? '#16A34A' : '#DC2626'} />
                <Text style={[styles.trendText, { color: trendPositive ? '#16A34A' : '#DC2626' }]}>
                  {formatTrend(trendDelta)}
                </Text>
              </View>
              <Text style={[styles.trendCaption, { color: COLORS.textMuted }]}>vs prior {timeframe.toLowerCase()}</Text>
            </View>
          </View>

          <View style={[styles.heroStatsRow, { borderTopColor: COLORS.border }]}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: COLORS.textPrimary }]}>{formatMetricValue(selectedMetric, totalAccumulated)}</Text>
              <Text style={[styles.heroStatLabel, { color: COLORS.textMuted }]}>Total</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: COLORS.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: COLORS.textPrimary }]}>{bestBucket && bestBucket.value > 0 ? bestBucket.label : '—'}</Text>
              <Text style={[styles.heroStatLabel, { color: COLORS.textMuted }]}>Best</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: COLORS.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: config.accent }]}>{formatMetricValue(selectedMetric, previousAverage)}</Text>
              <Text style={[styles.heroStatLabel, { color: COLORS.textMuted }]}>Prior avg</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricScroll}>
          {METRICS.map((m) => {
            const mc = METRIC_CONFIG[m];
            const active = selectedMetric === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.metricChip, { backgroundColor: active ? mc.accent + '22' : COLORS.card, borderColor: active ? mc.accent : COLORS.border, borderWidth: active ? 1.5 : 1 }]}
                onPress={() => setSelectedMetric(m)}
                activeOpacity={0.8}
              >
                <View style={[styles.metricChipDot, { backgroundColor: active ? mc.accent : COLORS.border }]} />
                <Text style={[styles.metricChipLabel, { color: active ? mc.accent : COLORS.textMuted, fontWeight: active ? '700' : '500' }]}>
                  {mc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.timeframeRow, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          {TIMEFRAMES.map((tf) => {
            const active = timeframe === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[styles.timeframeBtn, active && { backgroundColor: COLORS.primary }]}
                onPress={() => setTimeframe(tf)}
                activeOpacity={0.85}
              >
                <Text style={[styles.timeframeBtnText, { color: active ? COLORS.onPrimary : COLORS.textMuted }]}>{tf}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.chartCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, ...SHADOWS.small }]}>
          <View style={[styles.chartAccentBar, { backgroundColor: config.accent }]} />
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: COLORS.textPrimary }]}>{config.label} over time</Text>
            <Text style={[styles.chartCaption, { color: COLORS.textMuted }]}>{current.periodLabel}</Text>
          </View>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars={false}
            withHorizontalLabels={true}
            formatYLabel={(value) => formatYAxisLabel(value, selectedMetric)}
            chartConfig={chartConfig}
            style={styles.chartStyle}
          />
        </View>

        <View style={[styles.insightCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderLeftColor: config.accent }]}>
          <View style={styles.insightHeaderRow}>
            <Ionicons name="sparkles" size={16} color={config.accent} />
            <Text style={[styles.insightEyebrow, { color: config.accent }]}>AI INSIGHT</Text>
          </View>
          <Text style={[styles.insightText, { color: COLORS.textPrimary }]}>{insightText}</Text>
        </View>

      </ScrollView>

      <Modal visible={showExportModal} transparent animationType="slide" onRequestClose={() => !isExporting && setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.exportModalContainer, { backgroundColor: COLORS.card }]}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Export report</Text>
                <Text style={[styles.modalSubtitle, { color: COLORS.textMuted }]}>Choose format and metrics to include</Text>
              </View>
              <TouchableOpacity onPress={() => !isExporting && setShowExportModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionLabel, { color: COLORS.textMuted }]}>FORMAT</Text>
            <View style={styles.exportFormatRow}>
              {[
                { label: 'PDF Report',      icon: 'document-text-outline', desc: 'Branded, printable' },
                { label: 'CSV Spreadsheet', icon: 'grid-outline',           desc: 'Open in Excel / Sheets' },
              ].map((option) => {
                const active = exportFormat === option.label;
                return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setExportFormat(option.label)}
                    style={[styles.exportFormatCard, { backgroundColor: active ? COLORS.primaryContainer : COLORS.background, borderColor: active ? COLORS.primary : COLORS.border }]}
                  >
                    <Ionicons name={option.icon} size={22} color={active ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.exportFormatLabel, { color: active ? COLORS.primary : COLORS.textPrimary }]}>{option.label}</Text>
                    <Text style={[styles.exportFormatDesc, { color: COLORS.textMuted }]}>{option.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.modalSectionLabel, { color: COLORS.textMuted, marginTop: 20 }]}>INCLUDE</Text>
            <View style={styles.exportMetricsRow}>
              {Object.keys(exportIncludes).map((key) => {
                const mc = METRIC_CONFIG[key];
                const active = exportIncludes[key];
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleExportInclude(key)}
                    style={[styles.exportMetricChip, { backgroundColor: active ? mc.accent + '22' : COLORS.background, borderColor: active ? mc.accent : COLORS.border }]}
                  >
                    <Ionicons name={mc.icon} size={16} color={active ? mc.accent : COLORS.textMuted} />
                    <Text style={[styles.exportMetricLabel, { color: active ? mc.accent : COLORS.textMuted }]}>{mc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.saveNote, { backgroundColor: COLORS.primaryContainer }]}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={[styles.saveNoteText, { color: COLORS.primary }]}>
                You can save to your Downloads folder or share to any app.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: COLORS.background, borderColor: COLORS.border }]}
                onPress={() => !isExporting && setShowExportModal(false)}
                disabled={isExporting}
              >
                <Text style={[styles.modalCancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: COLORS.primary, opacity: isExporting ? 0.7 : 1 }]}
                onPress={executeExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={COLORS.onPrimary || '#fff'} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: COLORS.onPrimary }]}>Export & Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function AnalyticsScreen({ navigation }) {
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);
  const themePreference = useHealthStore((s) => s.themePreference);
  const { COLORS, FONTS, isDark, SHADOWS } = useTheme(themePreference);

  return (
    <View style={{ flex: 1 }}>
      <AnalyticsContent />
      {!isPremiumUser && (
        <BlurView
          style={[StyleSheet.absoluteFill, styles.blurContainer]}
          intensity={isDark ? 35 : 25}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
        >
          <View style={[styles.paywallCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, ...SHADOWS.medium }]}>
            <View style={[styles.paywallIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 30 }}>👑</Text>
            </View>
            <Text style={[styles.paywallTitle, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Advanced Analytics</Text>
            <Text style={[styles.paywallSubtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>
              Weekly trends, yearly comparisons, AI insights and exportable health reports.
            </Text>
            <TouchableOpacity
              style={[styles.paywallButton, { backgroundColor: COLORS.primary }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PaywallScreen')}
            >
              <Text style={[styles.paywallButtonText, { color: COLORS.onPrimary || '#FFFFFF' }]}>Unlock Premium</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  heading: { fontSize: 28, fontWeight: '800' },
  exportIconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  heroCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heroTextBlock: { flex: 1 },
  heroLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
  heroNumber: { fontSize: 40, fontWeight: '800', lineHeight: 46, letterSpacing: -1 },
  heroUnit: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  heroTrendBlock: { alignItems: 'flex-end', paddingTop: 4 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 4 },
  trendText: { fontSize: 12, fontWeight: '800' },
  trendCaption: { fontSize: 10, fontWeight: '500' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  heroStatLabel: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  heroStatDivider: { width: StyleSheet.hairlineWidth, height: 28, marginHorizontal: 8 },

  metricScroll: { paddingBottom: 14, gap: 8 },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  metricChipDot: { width: 7, height: 7, borderRadius: 3.5 },
  metricChipLabel: { fontSize: 14 },

  timeframeRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
  timeframeBtn: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  timeframeBtnText: { fontSize: 13, fontWeight: '700' },

  chartCard: { borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  chartAccentBar: { height: 3, width: '100%' },
  chartHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  chartCaption: { fontSize: 12 },
  chartStyle: { marginLeft: -10, paddingRight: 20 },

  insightCard: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, padding: 16, marginBottom: 8 },
  insightHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insightEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  insightText: { fontSize: 15, lineHeight: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  exportModalContainer: { width: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalDragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 3 },
  modalSubtitle: { fontSize: 13 },
  modalSectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  exportFormatRow: { flexDirection: 'row', gap: 10 },
  exportFormatCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 6 },
  exportFormatLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  exportFormatDesc: { fontSize: 11, textAlign: 'center' },
  exportMetricsRow: { flexDirection: 'row', gap: 10 },
  exportMetricChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  exportMetricLabel: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  saveNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, marginTop: 16 },
  saveNoteText: { fontSize: 12, flex: 1, lineHeight: 16 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700' },

  blurContainer: { justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10 },
  paywallCard: { width: '100%', borderRadius: 28, padding: 28, borderWidth: 1, alignItems: 'center' },
  paywallIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  paywallTitle: { textAlign: 'center', marginBottom: 10 },
  paywallSubtitle: { textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  paywallButton: { width: '100%', paddingVertical: 17, borderRadius: 999, alignItems: 'center' },
  paywallButtonText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});