import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/theme';

export default function TrackScreen() {
  const { COLORS, FONTS, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <Text style={[styles.title, FONTS.sectionHeading, { color: COLORS.textMain }]}>Track</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
