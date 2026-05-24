import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export default function StatCard({
  title,
  value,
  unit,
  iconName,
  iconColor = colors.primary,
}) {
  return (
    <View style={styles.card}>
      <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {!!unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    minHeight: 140,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
  icon: {
    marginBottom: 14,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textMain,
    marginRight: 6,
    lineHeight: 32,
  },
  unit: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
