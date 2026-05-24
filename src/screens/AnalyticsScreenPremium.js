import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useMemo, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

const TIMEFRAMES = ['Weekly', 'Monthly', 'Yearly'];
const METRICS = ['steps', 'water', 'sleep'];
const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const getDateKey = (date) => date.toISOString().split('T')[0];
const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};

const safeNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const standardDeviation = (values) => {
    if (!values.length) return 0;
    const avg = average(values);
    const variance = average(values.map((value) => (value - avg) ** 2));
    return Math.sqrt(variance);
};

const formatTrend = (value, suffix = '%') => {
    if (!Number.isFinite(value)) return `0${suffix}`;
    const rounded = Math.round(value);
    return `${rounded > 0 ? '+' : ''}${rounded}${suffix}`;
};

const formatMetricValue = (metric, value) => {
    if (metric === 'steps') return `${Math.round(value).toLocaleString()}`;
    if (metric === 'water') return `${value.toFixed(1)}L`;
    return `${value.toFixed(1)}h`;
};

// 1. DYNAMIC LABEL FORMATTER
const formatYAxisLabel = (value, metric) => {
    const numValue = Number(value);
    
    // Always return a clean 0 if the value is 0 (Fixes 0k, 0.0L)
    if (numValue === 0) return '0';

    if (metric === 'steps') {
        const scaled = numValue / 1000;
        // If it's a clean thousand, don't show decimals
        return scaled % 1 === 0 ? `${Math.round(scaled)}k` : `${scaled.toFixed(1)}k`;
    }

    if (metric === 'water') {
        return `${numValue.toFixed(1)}L`;
    }

    return `${numValue.toFixed(1)}h`;
};

const metricLabel = { steps: 'Steps', water: 'Water', sleep: 'Sleep' };

const extractDailySeries = (historyLogs, metric, transform = (v) => v) =>
    Object.entries(historyLogs || {})
        .map(([dateKey, values]) => ({
            dateKey,
            date: new Date(`${dateKey}T00:00:00`),
            value: transform(safeNumber(values?.[metric])),
        }))
        .filter((entry) => !Number.isNaN(entry.date.getTime()))
        .sort((a, b) => a.date - b.date);

const parseLegacySleepDate = (label, fallbackYear) => {
    const parsed = new Date(`${label} ${fallbackYear}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const alt = new Date(`${label}, ${fallbackYear}`);
    return Number.isNaN(alt.getTime()) ? null : alt;
};

const buildSleepFallback = (sleepHistory) =>
    (sleepHistory || [])
        .map((entry) => {
            const fallbackYear = new Date().getFullYear();
            const parsedDate = parseLegacySleepDate(entry.date, fallbackYear);
            return parsedDate
                ? {
                    dateKey: getDateKey(parsedDate),
                    date: parsedDate,
                    value: safeNumber(entry.duration),
                }
                : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);

const buildBuckets = (source, timeframe, offset = 0) => {
    const sorted = [...source].sort((a, b) => a.date - b.date);
    const now = toStartOfDay(new Date());

    if (timeframe === 'Weekly') {
        const rangeEnd = addDays(now, -offset * 7);
        const rangeStart = addDays(rangeEnd, -6);

        const buckets = Array.from({ length: 7 }, (_, index) => {
            const day = addDays(rangeStart, index);
            const dayKey = getDateKey(day);
            const matches = sorted.filter((item) => item.dateKey === dayKey);
            const values = matches.map((item) => item.value);
            return {
                label: day.toLocaleDateString([], { weekday: 'short' }),
                tooltipLabel: DATE_FMT.format(day),
                dateKey: dayKey,
                value: values.length ? average(values) : 0,
            };
        });

        return { buckets, periodLabel: `${DATE_FMT.format(rangeStart)} – ${DATE_FMT.format(rangeEnd)}` };
    }

    if (timeframe === 'Monthly') {
        const rangeEnd = addDays(now, -offset * 28);
        const rangeStart = addDays(rangeEnd, -27);

        const buckets = Array.from({ length: 4 }, (_, index) => {
            const bucketStart = addDays(rangeStart, index * 7);
            const bucketEnd = addDays(bucketStart, 6);
            const matches = sorted.filter((item) => item.date >= bucketStart && item.date <= bucketEnd);
            const values = matches.map((item) => item.value);
            return {
                label: `W${index + 1}`,
                tooltipLabel: `${DATE_FMT.format(bucketStart)} • ${DATE_FMT.format(bucketEnd)}`,
                dateKey: getDateKey(bucketStart),
                value: values.length ? average(values) : 0,
            };
        });

        return { buckets, periodLabel: `${DATE_FMT.format(rangeStart)} – ${DATE_FMT.format(rangeEnd)}` };
    }

    const year = new Date().getFullYear() - offset;
    const buckets = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0);
        const matches = sorted.filter((item) => item.date >= monthStart && item.date <= monthEnd);
        const values = matches.map((item) => item.value);
        return {
            label: monthStart.toLocaleDateString([], { month: 'short' }),
            tooltipLabel: monthStart.toLocaleDateString([], { month: 'long' }),
            dateKey: getDateKey(monthStart),
            value: values.length ? average(values) : 0,
        };
    });

    return { buckets, periodLabel: `${year}` };
};

const buildInsight = ({ metric, timeframe, buckets, previousBuckets }) => {
    const currentValues = buckets.map((bucket) => bucket.value);
    const previousValues = previousBuckets.map((bucket) => bucket.value);
    const bestBucket = buckets.reduce((best, bucket) => (bucket.value > (best?.value ?? -Infinity) ? bucket : best), null);
    const currentAverage = average(currentValues);
    const previousAverage = average(previousValues);
    const currentConsistency = Math.max(0, Math.round((1 - Math.min(standardDeviation(currentValues) / Math.max(currentAverage, 1), 1)) * 100));
    const previousConsistency = Math.max(0, Math.round((1 - Math.min(standardDeviation(previousValues) / Math.max(previousAverage, 1), 1)) * 100));
    const consistencyDelta = currentConsistency - previousConsistency;
    const trendDelta = previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : currentAverage > 0 ? 100 : 0;

    if (!bestBucket) return 'Start logging data to unlock personalized AI insights.';

    if (metric === 'water') {
        if (timeframe === 'Monthly') {
            return `Your hydration peaked in ${bestBucket.tooltipLabel} with a daily average of ${currentAverage.toFixed(1)}L. You are ${Math.abs(Math.round(consistencyDelta))}% ${consistencyDelta >= 0 ? 'more' : 'less'} consistent this month.`;
        }
        if (timeframe === 'Yearly') {
            return `Your strongest hydration month was ${bestBucket.tooltipLabel} at ${currentAverage.toFixed(1)}L/day. That is ${formatTrend(trendDelta)} versus the previous year.`;
        }
        return `You averaged ${currentAverage.toFixed(1)}L/day this week, with ${bestBucket.label} as your strongest day. Current consistency is ${currentConsistency}%.`;
    }

    if (metric === 'steps') {
        if (timeframe === 'Monthly') {
            return `Your activity peaked in ${bestBucket.tooltipLabel} at ${Math.round(bestBucket.value).toLocaleString()} steps/day. You are ${formatTrend(trendDelta)} more active than the previous month.`;
        }
        if (timeframe === 'Yearly') {
            return `Your strongest month was ${bestBucket.tooltipLabel} with an average of ${Math.round(bestBucket.value).toLocaleString()} steps/day. Trend versus the previous year: ${formatTrend(trendDelta)}.`;
        }
        return `You averaged ${Math.round(currentAverage).toLocaleString()} steps/day this week. ${bestBucket.label} was your best day, and momentum is ${formatTrend(trendDelta)}.`;
    }

    if (timeframe === 'Monthly') {
        return `Your sleep peaked in ${bestBucket.tooltipLabel} with a daily average of ${currentAverage.toFixed(1)}h. You are ${formatTrend(consistencyDelta)} more consistent this month.`;
    }

    if (timeframe === 'Yearly') {
        return `Your strongest sleep month was ${bestBucket.tooltipLabel} at ${currentAverage.toFixed(1)}h/night. Trend versus the previous year: ${formatTrend(trendDelta)}.`;
    }

    return `You averaged ${currentAverage.toFixed(1)}h/night this week, with ${bestBucket.label} as your best night.`;
};

// Core analytics content (renamed from AnalyticsScreenPremium)
function AnalyticsContent() {
    const { COLORS, FONTS, RADII, SHADOWS, isDark } = useTheme();
    const historyLogs = useHealthStore((state) => state.historyLogs);
    const sleepHistory = useHealthStore((state) => state.sleepHistory);

    const [timeframe, setTimeframe] = useState('Weekly');
    const [selectedMetric, setSelectedMetric] = useState('steps');

    const waterHistory = useMemo(() => extractDailySeries(historyLogs || {}, 'water', (value) => value / 1000), [historyLogs]);
    const stepHistory = useMemo(() => extractDailySeries(historyLogs || {}, 'steps', (value) => value), [historyLogs]);
    const sleepHistorySeries = useMemo(() => {
        const fromLogs = extractDailySeries(historyLogs || {}, 'sleep', (value) => value);
        return fromLogs.length ? fromLogs : buildSleepFallback(sleepHistory);
    }, [historyLogs, sleepHistory]);

    const sourceSeries = useMemo(
        () => ({ steps: stepHistory, water: waterHistory, sleep: sleepHistorySeries }),
        [sleepHistorySeries, stepHistory, waterHistory],
    );

    const { current, previous } = useMemo(() => {
        const currentSeries = buildBuckets(sourceSeries[selectedMetric], timeframe, 0);
        const previousSeries = buildBuckets(sourceSeries[selectedMetric], timeframe, 1);
        return { current: currentSeries, previous: previousSeries };
    }, [selectedMetric, sourceSeries, timeframe]);

    const currentValues = current.buckets.map((bucket) => bucket.value);
    const previousValues = previous.buckets.map((bucket) => bucket.value);
    const currentAverage = average(currentValues);
    const totalAccumulated = useMemo(() => currentValues.reduce((sum, value) => sum + value, 0), [currentValues]);
    const bestBucket = current.buckets.reduce((best, bucket) => (bucket.value > (best?.value ?? -Infinity) ? bucket : best), null);
    const previousAverage = average(previousValues);
    const trendDelta = previousAverage > 0 ? ((currentAverage - previousAverage) / previousAverage) * 100 : currentAverage > 0 ? 100 : 0;
    const chartWidth = screenWidth - 32;

    // 2. EMPTY DATA SCALE FIX
    const maxCurrentValue = currentValues.length ? Math.max(...currentValues) : 0;
    let chartDatasets = [{ data: currentValues.length ? currentValues : [0] }];
    
    // If the data is empty (all zeros), inject a transparent "ghost" dataset to force the y-axis ceiling
    if (maxCurrentValue === 0) {
        const defaultMax = selectedMetric === 'steps' ? 5000 : selectedMetric === 'water' ? 3 : 8;
        chartDatasets.push({
            data: [defaultMax],
            color: () => 'transparent', // Make it invisible
            strokeWidth: 0,
            withDots: false,
        });
    }

    const chartData = {
        labels: current.buckets.map((bucket) => bucket.label),
        datasets: chartDatasets,
    };

    const chartConfig = useMemo(
        () => ({
            backgroundColor: COLORS.card,
            backgroundGradientFrom: COLORS.card,
            backgroundGradientTo: COLORS.card,
            decimalPlaces: selectedMetric === 'steps' ? 0 : 1,
            color: (opacity = 1) => `rgba(${COLORS.primary === '#126E56' ? '18, 110, 86' : '47, 191, 155'}, ${opacity})`,
            labelColor: (opacity = 1) => {
                const hex = (COLORS.textSecondary || COLORS.textMuted || '#64748B').replace('#', '');
                const bigint = parseInt(hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex, 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            },
            propsForLabels: {
                fontSize: 10, // Slightly smaller font for clean spacing
            },
            propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '4 4' },
            propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
            fillShadowGradientFrom: COLORS.startGradient,
            fillShadowGradientFromOpacity: 0.24,
            fillShadowGradientTo: COLORS.endGradient,
            fillShadowGradientToOpacity: 0.04,
            useShadowColorFromDataset: false,
            barPercentage: 0.75,
        }),
        [COLORS, selectedMetric],
    );

    const insightText = useMemo(
        () =>
            buildInsight({
                metric: selectedMetric,
                timeframe,
                buckets: current.buckets,
                previousBuckets: previous.buckets,
            }),
        [current.buckets, previous.buckets, selectedMetric, timeframe],
    );

    const metricOptions = useMemo(
        () =>
            METRICS.map((metric) => ({
                key: metric,
                label: metricLabel[metric],
                value: metric,
            })),
        [],
    );

    const summaryCards = [
        { label: 'Daily Average', value: formatMetricValue(selectedMetric, currentAverage), caption: `${timeframe} average` },
        { label: 'Total Accumulated', value: formatMetricValue(selectedMetric, totalAccumulated), caption: `Across ${timeframe.toLowerCase()}` },
        {
            label: timeframe === 'Weekly' ? 'Best Day' : timeframe === 'Monthly' ? 'Best Week' : 'Best Month',
            value: bestBucket ? `${bestBucket.label}` : '-',
            caption: bestBucket ? formatMetricValue(selectedMetric, bestBucket.value) : 'No data yet',
        },
        { label: 'Trend', value: formatTrend(trendDelta), caption: previousAverage > 0 ? `vs previous ${timeframe.toLowerCase()}` : 'No comparison yet' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textPrimary }]}>Analytics</Text>
                        <Text style={[styles.subtitle, FONTS.bodyText, { color: COLORS.textMuted }]}>Premium wellness intelligence</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: COLORS.primaryContainer }]}>
                        <Text style={[styles.badgeText, { color: COLORS.primary }]}>Premium</Text>
                    </View>
                </View>

                <View style={[styles.segmentContainer, { backgroundColor: COLORS.surface || COLORS.card, borderColor: COLORS.border }]}>
                    {TIMEFRAMES.map((option) => {
                        const active = timeframe === option;
                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.segmentButton,
                                    { backgroundColor: active ? COLORS.primary : 'transparent', borderColor: active ? COLORS.primary : 'transparent' },
                                ]}
                                onPress={() => setTimeframe(option)}
                                activeOpacity={0.9}
                            >
                                <Text style={[styles.segmentText, { color: active ? COLORS.onPrimary : COLORS.textPrimary }]}>{option}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={[styles.segmentContainer, { backgroundColor: COLORS.surface || COLORS.card, borderColor: COLORS.border }]}>
                    {metricOptions.map((metric) => {
                        const active = selectedMetric === metric.value;
                        return (
                            <TouchableOpacity
                                key={metric.key}
                                style={[
                                    styles.segmentButton,
                                    { backgroundColor: active ? COLORS.primary : 'transparent', borderColor: active ? COLORS.primary : 'transparent' },
                                ]}
                                onPress={() => setSelectedMetric(metric.value)}
                                activeOpacity={0.9}
                            >
                                <Text style={[styles.segmentText, { color: active ? COLORS.onPrimary : COLORS.textPrimary }]}>{metric.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={[styles.chartCard, { backgroundColor: COLORS.card, borderColor: COLORS.border, ...SHADOWS.small }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.chartTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>{metricLabel[selectedMetric]} Performance</Text>
                            <Text style={[styles.chartCaption, FONTS.smallText, { color: COLORS.textMuted }]}>{current.periodLabel}</Text>
                        </View>
                        <Text style={[styles.chartStat, FONTS.cardTitle, { color: COLORS.primary }]}>{formatMetricValue(selectedMetric, currentAverage)}</Text>
                    </View>

                    {/* 3. CHART PROPS UPDATED */}
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={260}
                        bezier
                        fromZero
                        withDots
                        withInnerLines
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLines
                        segments={4}
                        formatYLabel={(value) => formatYAxisLabel(value, selectedMetric)}
                        yLabelsOffset={16} // Added breathing room
                        xLabelsOffset={-4}
                        chartConfig={chartConfig}
                        style={styles.chart}
                    />
                </View>

                <View style={styles.statsGrid}>
                    {summaryCards.map((card) => {
                        const isTrend = card.label === 'Trend';
                        const trendPositive = trendDelta >= 0;
                        return (
                            <View
                                key={card.label}
                                style={[
                                    styles.statCard,
                                    { backgroundColor: COLORS.card, borderColor: COLORS.border, borderRadius: RADII.md, ...SHADOWS.small },
                                ]}
                            >
                                <Text style={[styles.statLabel, FONTS.cardText, { color: COLORS.textMuted }]}>{card.label}</Text>
                                <Text
                                    style={[
                                        styles.statValue,
                                        FONTS.cardTitle,
                                        { color: isTrend ? (trendPositive ? COLORS.success : COLORS.error) : COLORS.textPrimary },
                                    ]}
                                >
                                    {card.value}
                                </Text>
                                <Text style={[styles.statCaption, FONTS.cardsubtitle, { color: COLORS.textMuted }]}>{card.caption}</Text>
                            </View>
                        );
                    })}
                </View>

                <View style={[styles.insightCard, { backgroundColor: isDark ? COLORS.card : COLORS.primaryContainer, borderColor: COLORS.primaryContainer, ...SHADOWS.small }]}>
                    <View style={styles.insightHeader}>
                        <Text style={[styles.insightTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>AI Insight Engine</Text>
                        <View style={[styles.insightBadge, { backgroundColor: COLORS.primary }]}>
                            <Text style={[styles.insightBadgeText, { color: COLORS.onPrimary }]}>Premium AI</Text>
                        </View>
                    </View>
                    <Text style={[styles.insightText, FONTS.bodyText, { color: COLORS.textPrimary }]}>{insightText}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Main Wrapper providing the Premium Glassmorphic Paywall Overlay
export default function AnalyticsScreen({ navigation }) {
    const isPremiumUser = useHealthStore((state) => state.isPremiumUser);
    const { COLORS, FONTS, isDark, SHADOWS } = useTheme();

    return (
        <View style={{ flex: 1 }}>
            {/* The actual analytics render in the background */}
            <AnalyticsContent />
            
            {/* The Premium Paywall Overlay */}
            {!isPremiumUser && (
                <BlurView
                    style={[StyleSheet.absoluteFill, styles.blurContainer]}
                    intensity={isDark ? 30 : 20}
                    tint={isDark ? 'dark' : 'light'}
                    experimentalBlurMethod="dimezisBlurView"
                >
                    <View style={[
                        styles.paywallCard,
                        { 
                            backgroundColor: COLORS.card, 
                            borderColor: COLORS.border,
                            ...SHADOWS.small 
                        }
                    ]}>
                        <View style={[styles.paywallIconWrap, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                            <Ionicons name="lock-closed" size={28} color={COLORS.primary} />
                        </View>
                        
                        <Text style={[styles.paywallTitle, FONTS.mainHeading, { color: COLORS.textPrimary }]}>
                            Unlock Advanced Analytics
                        </Text>
                        
                        <Text style={[styles.paywallSubtitle, FONTS.bodyText, { color: COLORS.textSecondary || COLORS.textMuted }]}>
                            Get deep insights into your habits, compare weekly trends, and optimize your health.
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.paywallButton, { backgroundColor: COLORS.primary }]}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('PaywallScreen')}
                        >
                            <Text style={[styles.paywallButtonText, { color: COLORS.onPrimary || '#FFFFFF' }]}>
                                Upgrade to Premium
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 110 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    title: { marginBottom: 2 },
    subtitle: { fontSize: 13 },
    badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
    segmentContainer: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 14, gap: 6 },
    segmentButton: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1 },
    segmentText: { fontSize: 13, fontWeight: '700' },
    metricRow: { gap: 10, paddingVertical: 4, paddingBottom: 12 },
    metricPill: { minWidth: 110, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
    metricText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
    metricUnit: { marginTop: 2, fontSize: 12, fontWeight: '600' },
    chartCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, marginBottom: 14, backgroundColor: 'transparent' },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    chartTitle: { marginBottom: 3 },
    chartCaption: { fontSize: 12 },
    chartStat: { fontWeight: '800' },
    chart: { marginLeft: -25, borderRadius: 16 }, // Shifted slightly for Y-Axis space
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
    statCard: { width: '48%', borderWidth: 1, padding: 12, backgroundColor: 'transparent' },
    statLabel: { marginBottom: 6 },
    statValue: { fontSize: 18, marginBottom: 4 },
    statCaption: { fontSize: 12 },
    insightCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
    insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    insightTitle: { flex: 1, marginRight: 12 },
    insightBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    insightBadgeText: { fontSize: 11, fontWeight: '800' },
    insightText: { fontSize: 15, lineHeight: 22 },
    
    // Premium Overlay Styles
    blurContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 10,
    },
    paywallCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    paywallIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 20,
    },
    paywallTitle: {
        textAlign: 'center',
        marginBottom: 10,
    },
    paywallSubtitle: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    paywallButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    paywallButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});