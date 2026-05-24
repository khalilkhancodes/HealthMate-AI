import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { COLORS } from '../theme/theme';

export default function AIScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI</Text>
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
    color: COLORS.textMain,
  },
});
