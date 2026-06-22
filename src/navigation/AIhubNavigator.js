import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AICalorieScreen from '../screens/AICalorieScreen';
import AIDoctorScreen from '../screens/AIDoctorScreen';
import AIHubScreen from '../screens/AIHubScreen';
import AIIngredientScreen from '../screens/AIIngredientScreen';
import AIMealPlannerScreen from '../screens/AIMealPlannerScreen';

const Stack = createNativeStackNavigator();

// Mirrors the structure of ToolsNavigator.js: a stack scoped to the AI Hub
// tab so that navigating into a sub-tool (Meal Planner, Doctor, etc.) keeps
// the bottom tab bar visible, instead of covering it like a root-level
// screen would.
export default function AIHubNavigator() {
  return (
    <Stack.Navigator initialRouteName="AIHubMenu" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIHubMenu" component={AIHubScreen} />
      <Stack.Screen name="AIMealPlannerScreen" component={AIMealPlannerScreen} />
      <Stack.Screen name="AIIngredientScreen" component={AIIngredientScreen} />
      <Stack.Screen name="AICalorieScreen" component={AICalorieScreen} />
      <Stack.Screen name="AIDoctorScreen" component={AIDoctorScreen} />
    </Stack.Navigator>
  );
}