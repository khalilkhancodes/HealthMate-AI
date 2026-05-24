import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const screenWidth = Dimensions.get('window').width;
const RANGE_OPTIONS = ['Week', 'Month', 'Year'];

const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const stepsData = [6200, 7800, 6900, 9200, 8600, 10100, 8400];
const waterData = [1900, 2100, 1850, 2300, 2400, 2250, 2050];
const sleepData = [6.8, 7.2, 6.4, 7.9, 8.1, 7.5, 7.0];

function ChartSection({ value, subtitle, COLORS, FONTS, children }) {
  return (
    <View style={[styles.chartSection, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
      <View style={styles.heroMetricWrap}>
        <Text style={[styles.heroMetricValue, FONTS.bigNumbers, { color: COLORS.textMain }]}>{value}</Text>
        <Text style={[styles.heroMetricSubtitle, FONTS.smallText, { color: COLORS.textMuted }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ChartsScreen({ navigation }) {
  const { COLORS, FONTS, isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState('Week');
  const isPremiumUser = useHealthStore((state) => state.isPremiumUser);

  const premiumChartConfig = {
    backgroundColor: COLORS.card,
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    fillShadowGradientFrom: COLORS.primary,
    fillShadowGradientFromOpacity: 0.4,
    fillShadowGradientTo: COLORS.surface,
    fillShadowGradientToOpacity: 0,
    color: (opacity = 1) => COLORS.primary,
    labelColor: (opacity = 1) => COLORS.textMuted,
    strokeWidth: 4,
    propsForDots: {
      r: '5',
      strokeWidth: '3',
      stroke: COLORS.surface,
    },
    propsForBackgroundLines: {
      stroke: COLORS.border,
      strokeDasharray: '',
    },
    decimalPlaces: 0,
  };

  const renderCharts = () => (
    <>
      <ChartSection value="8,432" subtitle="Average Daily Steps" COLORS={COLORS} FONTS={FONTS}>
        <LineChart
          data={{ labels: weekLabels, datasets: [{ data: stepsData }] }}
          width={screenWidth - 40}
          height={180}
          withInnerLines
          withVerticalLines={false}
          withOuterLines={false}
          withVerticalLabels
          withHorizontalLabels
          
          chartConfig={premiumChartConfig}
          bezier
          formatYLabel={(yValue) => {
            const intValue = parseInt(yValue, 10);
            return intValue >= 1000 ? `${(intValue / 1000).toFixed(1)}k` : intValue;
          }}
          style={styles.edgeChart}

        />
      </ChartSection>

      <ChartSection value="2,100" subtitle="Average Hydration (ml)" COLORS={COLORS} FONTS={FONTS}>
        <BarChart
          data={{ labels: weekLabels, datasets: [{ data: waterData }] }}
          width={screenWidth - 40}
          height={180}
          withInnerLines
          fromZero
          showBarTops={false}
          chartConfig={{
            ...premiumChartConfig,
            color: () => COLORS.primary,
            fillShadowGradient: COLORS.primary,
            fillShadowGradientOpacity: 1,
            barPercentage: 0.8,
          }}
          style={styles.edgeChart}
        />
      </ChartSection>

      <ChartSection value="7.3h" subtitle="Average Sleep Duration" COLORS={COLORS} FONTS={FONTS}>
        <LineChart
          data={{ labels: weekLabels, datasets: [{ data: sleepData }] }}
          width={screenWidth - 40}
          height={180}
          yAxisSuffix="h"
          withInnerLines
          withVerticalLines={false}
          withOuterLines={false}
          chartConfig={premiumChartConfig}
          bezier
          style={styles.edgeChart}
        />
      </ChartSection>
    </>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, FONTS.mainHeading, { color: COLORS.textMain }]}>Analytics</Text>
      <Text style={[styles.subtitle, FONTS.smallText, { color: COLORS.textMuted }]}>Track your progress</Text>

      <View style={[styles.toggleRow, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
        {RANGE_OPTIONS.map((option) => {
          const active = option === selectedRange;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.toggleButton,
                active && [styles.toggleButtonActive, { backgroundColor: COLORS.background }],
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedRange(option)}
            >
              <Text
                style={[
                  styles.toggleText,
                  FONTS.bodyText,
                  { color: COLORS.textMuted },
                  active && { color: COLORS.textMain },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.chartsContainer}>
        <View style={[styles.chartsLayer, !isPremiumUser && styles.chartsLayerLocked]}>{renderCharts()}</View>

        {!isPremiumUser && (
          <View
            style={[
              styles.premiumOverlay,
              { backgroundColor: COLORS.primary, borderColor: COLORS.border, opacity: isDark ? 0.94 : 1 },
            ]}
          >
            <View style={[styles.lockCircle, { backgroundColor: COLORS.card }]}>
              <Ionicons name="lock-closed" size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.overlayTitle, FONTS.subheading, { color: COLORS.card }]}>
              Advanced Health Insights are Premium
            </Text>
            <TouchableOpacity
              style={[styles.unlockButton, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PaywallScreen')}
            >
              <Text style={[styles.unlockButtonText, FONTS.bodyText, { color: COLORS.primary }]}>Unlock Analytics</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginBottom: 50,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 35,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 32,
  },
  toggleRow: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {},
  toggleText: {},
  chartsContainer: {
    position: 'relative',
    width: '100%',
  },
  chartsLayer: {
    opacity: 1,
  },
  chartsLayerLocked: {
    opacity: 0.3,
  },
  chartSection: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  heroMetricWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroMetricValue: {},
  heroMetricSubtitle: {
    marginBottom: 8,
  },
  edgeChart: {
    marginLeft: -10,
    marginTop: 10,
  },
  premiumOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '18%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overlayTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  unlockButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  unlockButtonText: {
    fontWeight: '700',
  },
});
