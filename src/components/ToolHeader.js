import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme';

export default function ToolHeader({ navigation, title }) {
  const { COLORS, FONTS, SHADOWS } = useTheme();

  const canGoBack = typeof navigation?.canGoBack === 'function' ? navigation.canGoBack() : true;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: COLORS.background, borderBottomColor: COLORS.border }]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: COLORS.background,
            borderBottomColor: COLORS.border,
            shadowColor: SHADOWS.small.shadowColor,
            shadowOpacity: SHADOWS.small.shadowOpacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            if (canGoBack) {
              navigation.goBack();
            }
          }}
          disabled={!canGoBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text numberOfLines={1} style={[styles.title, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>
          {title}
        </Text>

        <View style={styles.rightSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: 1,
  },
  container: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  rightSpacer: {
    width: 44,
    height: 44,
  },
});