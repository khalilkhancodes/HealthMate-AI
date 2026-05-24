import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BMIScreen from '../screens/BMIScreen';
import BMRScreen from '../screens/BMRScreen';
import SleepScreen from '../screens/SleepScreen';
import StepScreen from '../screens/StepScreen';
import ToolsMenuScreen from '../screens/ToolsMenuScreen';
import WaterScreen from '../screens/WaterScreen';
import { useTheme } from '../theme/theme';

const Stack = createNativeStackNavigator();

export default function ToolsNavigator() {
  const { COLORS, isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ToolsMenuScreen"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerShadowVisible: false,
        headerTintColor: COLORS.textPrimary,
        headerTitleAlign: 'center',
        headerLargeTitle: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.textPrimary,
        },
        headerBackTitleVisible: false,
        statusBarStyle: isDark ? 'light' : 'dark',
      }}
    >
      <Stack.Screen
        name="ToolsMenuScreen"
        component={ToolsMenuScreen}
        options={{ title: 'Health Tools', headerShown: false }}
      />
      <Stack.Screen
        name="BMIScreen"
        component={BMIScreen}
        options={{ title: 'BMI Calculator' }}
      />
      <Stack.Screen
        name="BMRScreen"
        component={BMRScreen}
        options={{ title: 'BMR Calculator' }}
      />
      <Stack.Screen
        name="WaterScreen"
        component={WaterScreen}
        options={{ title: 'Water Tracker' }}
      />
      <Stack.Screen
        name="SleepScreen"
        component={SleepScreen}
        options={{ title: 'Sleep Log' }}
      />
      <Stack.Screen
        name="StepScreen"
        component={StepScreen}
        options={{ title: 'Step Counter' }}
      />
    </Stack.Navigator>
  );
}
