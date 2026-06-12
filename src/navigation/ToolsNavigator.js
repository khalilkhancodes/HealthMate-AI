import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ToolHeader from '../components/ToolHeader';
import BMIScreen from '../screens/BMIScreen';
import BMRScreen from '../screens/BMRScreen';
import SleepScreen from '../screens/SleepScreen';
import StepScreen from '../screens/StepScreen';
import ToolsMenuScreen from '../screens/ToolsMenuScreen';
import WaterScreen from '../screens/WaterScreen';
import { useTheme } from '../theme/theme';

const Stack = createNativeStackNavigator();

const TOOL_TITLES = {
  BMIScreen: 'BMI Calculator',
  BMRScreen: 'BMR Calculator',
  WaterScreen: 'Water Tracker',
  SleepScreen: 'Sleep Log',
  StepScreen: 'Step Counter',
};

export default function ToolsNavigator() {
  const { COLORS, isDark } = useTheme();

  const renderToolHeader = (route, navigation) => (
    <ToolHeader navigation={navigation} title={TOOL_TITLES[route.name] || route.name} />
  );

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
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => renderToolHeader(route, navigation),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
          contentStyle: { backgroundColor: COLORS.background },
        })}
      />
      <Stack.Screen
        name="BMRScreen"
        component={BMRScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => renderToolHeader(route, navigation),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
          contentStyle: { backgroundColor: COLORS.background },
        })}
      />
      <Stack.Screen
        name="WaterScreen"
        component={WaterScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => renderToolHeader(route, navigation),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
          contentStyle: { backgroundColor: COLORS.background },
        })}
      />
      <Stack.Screen
        name="SleepScreen"
        component={SleepScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => renderToolHeader(route, navigation),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
          contentStyle: { backgroundColor: COLORS.background },
        })}
      />
      <Stack.Screen
        name="StepScreen"
        component={StepScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => renderToolHeader(route, navigation),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.background },
          contentStyle: { backgroundColor: COLORS.background },
        })}
      />
    </Stack.Navigator>
  );
}
