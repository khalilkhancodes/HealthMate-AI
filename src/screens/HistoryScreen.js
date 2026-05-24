import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const getMetricConfig = (COLORS) => ({
  water: {
    icon: 'water-outline',
    color: COLORS.water,
    formatter: (value) => `${(Number(value) / 1000).toFixed(2)} L`,
  },
  sleep: {
    icon: 'moon-outline',
    color: COLORS.sleep,
    formatter: (value) => `${Number(value).toFixed(1)} hrs`,
  },
  steps: {
    icon: 'footsteps-outline',
    color: COLORS.steps,
    formatter: (value) => `${Number(value).toLocaleString()} steps`,
  },
  weight: {
    icon: 'barbell-outline',
    color: COLORS.weight,
    formatter: (value) => `${Number(value).toFixed(1)} kg`,
  },
});

export default function HistoryScreen() {
  const { COLORS, FONTS, isDark } = useTheme();
  const metricConfig = getMetricConfig(COLORS);

  const historyLogs = useHealthStore((state) => state.historyLogs);

  const sortedDates = Object.keys(historyLogs).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, FONTS.mainHeading]}>Your Progress</Text>
        <Text style={[styles.subheader, FONTS.subheading]}> 
          Track your health journey over time.
        </Text>

        {sortedDates.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
            <Ionicons name="time-outline" size={44} color={COLORS.textMuted} />
            <Text style={[styles.emptyText, { color: COLORS.textMuted }]}>No history logged yet. Start using your tools!</Text>
          </View>
        ) : (
          sortedDates.map((dateKey) => {
            const dayMetrics = historyLogs[dateKey] || {};
            const availableMetrics = Object.keys(metricConfig).filter(
              (metric) => dayMetrics[metric] !== undefined && dayMetrics[metric] !== null
            );

            return (
              <View key={dateKey} style={[styles.dateCard, { backgroundColor: COLORS.card, shadowColor: isDark ? COLORS.background : '#000000' }]}>
                <Text style={[styles.dateTitle, { color: COLORS.textMain }]}>{dateKey}</Text>

                <View style={styles.metricGrid}>
                  {availableMetrics.map((metric) => (
                    <View key={metric} style={[styles.metricItem, { backgroundColor: COLORS.surface }]}>
                      <Ionicons
                        name={metricConfig[metric].icon}
                        size={19}
                        color={metricConfig[metric].color}
                      />
                      <Text style={[styles.metricValue, { color: COLORS.textMain }]}>
                        {metricConfig[metric].formatter(dayMetrics[metric])}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
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
    paddingTop: 45,
    paddingBottom: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  subheader: {
    marginBottom: 40,
  },
  emptyState: {
    marginTop: 28,
    borderRadius: 20,
    paddingVertical: 34,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '500',
  },
  dateCard: {
    borderRadius: 12,
    width: '100%',
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
