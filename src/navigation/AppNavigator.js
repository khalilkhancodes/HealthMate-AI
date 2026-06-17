import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

// Screens
import ToolHeader from '../components/ToolHeader';
import AIChatScreen from '../screens/AIChatScreen';
import AnalyticsScreenPremium from '../screens/AnalyticsScreenPremium';
import BMIScreen from '../screens/BMIScreen';
import HelpScreen from '../screens/HelpScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PaywallScreen from '../screens/PaywallScreen.js';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SleepScreen from '../screens/SleepScreen';
import StepScreen from '../screens/StepScreen';
import StreakDetailsScreen from '../screens/StreakDetailsScreen';
import WaterScreen from '../screens/WaterScreen';
import ToolsNavigator from './ToolsNavigator';
import NotificationsScreen from '../screens/NotificationsScreen';
import AIHubScreen from '../screens/AIHubScreen';
import AIIngredientScreen from '../screens/AIIngredientScreen'
import AICalorieScreen from '../screens/AICalorieScreen'
import AIDoctorScreen from '../screens/AIDoctorScreen'
import AIMealPlannerScreen from '../screens/AIMealPlannerScreen'

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Home: 'home',
  Tools: 'construct',
  Analytics: 'analytics',
  Profile: 'person',
};

const TOOL_TITLES = {
  WaterScreen: 'Water Tracker',
  SleepScreen: 'Sleep Log',
  BMIScreen: 'BMI Calculator',
  StepScreen: 'Step Counter',
};

// 1. The Custom Floating Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { COLORS, SPACING, RADII, SHADOWS, isDark } = useTheme();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 10 }]}>
      <View style={[
        styles.floatingPill,
        {
          backgroundColor: COLORS.card,
          borderRadius: RADII.lg,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          shadowColor: SHADOWS.medium.shadowColor,
          shadowOpacity: SHADOWS.medium.shadowOpacity,
        }
      ]}>
        <TouchableOpacity
          style={styles.fabContainer}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AIChatScreen')}
        >
          <LinearGradient colors={[COLORS.startGradient, COLORS.endGradient]} style={styles.fabGradient}>
            <Ionicons name="sparkles" size={24} color={'#ffffff' || '#FFFFFF'} />
          </LinearGradient>
        </TouchableOpacity>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const baseName = iconMap[route.name] || 'ellipse';
          const iconName = isFocused ? baseName : `${baseName}-outline`;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && { backgroundColor: isDark ? COLORS.primaryContainer : (COLORS.primaryContainer || '#E6F4FE') }
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textSecondary}
              />
              {isFocused && (
                <Text style={[styles.tabLabel, { color: COLORS.primary }]}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// 2. The Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />} // Injecting our custom UI
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tools" component={ToolsNavigator} />
      <Tab.Screen name="Analytics" component={AnalyticsScreenPremium} />
      <Tab.Screen name="AI Hub" component={AIHubScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 3. The Root Stack Navigator
export default function AppNavigator() {
  const { COLORS } = useTheme();

  const renderToolHeader = (route, navigation) => (
    <ToolHeader navigation={navigation} title={TOOL_TITLES[route.name] || route.name} />
  );

  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AppNavigator" component={TabNavigator} />
      <Stack.Screen
        name="LoginNavigator"
        component={LoginScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PaywallScreen"
        component={PaywallScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIChatScreen"
        component={AIChatScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="StreakDetails"
        component={StreakDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AnalyticsScreenPremium"
        component={AnalyticsScreenPremium}
        options={{ headerShown: false }}
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
        name="HelpScreen"
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicyScreen"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIIngredientScreen"
        component={AIIngredientScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIDoctorScreen"
        component={AIDoctorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AICalorieScreen"
        component={AICalorieScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIMealPlannerScreen"
        component={AIMealPlannerScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// 4. Custom Tab Bar Styles
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', // This makes it float over the screen content
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 10, // Buffer space above the pill
  },
  floatingPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // Pure white pill
    borderRadius: 40,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%', // Leaves a small gap on the left and right

    // Premium drop shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10, // For Android shadow
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  tabItemFocused: {
    backgroundColor: '#E6F4FE', // Very light tint of your Primary Blue
  },
  tabLabel: {
    marginLeft: 6,
    color: '#0072FF',
    fontWeight: '700',
    fontSize: 13,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 5,
    width: 60,
    height: 60,
    borderRadius: 30,
    // marginBottom: 60,
    shadowColor: '#0B6B43',
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});