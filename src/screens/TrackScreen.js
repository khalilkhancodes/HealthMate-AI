import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
export default function TrackScreen() {
  const { COLORS, FONTS } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}> 
      <Text style={[styles.title, FONTS.sectionHeading, { color: COLORS.textMain }]}>Track</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
