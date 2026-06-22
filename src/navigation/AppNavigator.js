import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

// Screens
import ToolHeader from '../components/ToolHeader';
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
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';

// AI Tool Screens
import AIChatScreen from '../screens/AIChatScreen';
import AIHubScreen from '../screens/AIHubScreen'; // <-- IMPORT DIRECTLY
import AIDoctorScreen from '../screens/AIDoctorScreen';
import AICalorieScreen from '../screens/AICalorieScreen';
import AIIngredientScreen from '../screens/AIIngredientScreen';
import AIMealPlannerScreen from '../screens/AIMealPlannerScreen';

// Navigators
import ToolsNavigator from './ToolsNavigator';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const iconMap = {
  Home: 'home',
  Tools: 'construct',
  'AI Hub': 'planet', 
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

  // Determine current active tab
  const currentRouteName = state.routes[state.index].name;
  const isAIHubActive = currentRouteName === 'AI Hub';

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 10 }]}>
      
      {/* Ask AI Floating Button - Hidden on AI Hub Tab */}
      {!isAIHubActive && (
        <TouchableOpacity
          style={styles.fabContainer}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AIChatScreen')}
        >
          <LinearGradient 
            colors={[COLORS.startGradient || COLORS.primary, COLORS.endGradient || COLORS.primary]} 
            style={styles.fabGradient}
          >
            <Text style={styles.fabText}>✨ Ask AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

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
      tabBar={(props) => <CustomTabBar {...props} />} 
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tools" component={ToolsNavigator} />
      {/* MAP DIRECTLY TO THE SCREEN, NOT A NAVIGATOR */}
      <Tab.Screen name="AI Hub" component={AIHubScreen} /> 
      <Tab.Screen name="Analytics" component={AnalyticsScreenPremium} />
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
      
      {/* Modal Presentations */}
      <Stack.Screen name="LoginNavigator" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PaywallScreen" component={PaywallScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AIChatScreen" component={AIChatScreen} options={{ presentation: 'modal' }} />
      
      {/* Standard App Screens */}
      <Stack.Screen name="StreakDetails" component={StreakDetailsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="AnalyticsScreenPremium" component={AnalyticsScreenPremium} />
      <Stack.Screen name="HelpScreen" component={HelpScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
      <Stack.Screen name="NotificationCenterScreen" component={NotificationCenterScreen} />

      {/* Hardware / Tracker Tools */}
      <Stack.Screen name="StepScreen" component={StepScreen} options={({ navigation, route }) => ({
        headerShown: true, header: () => renderToolHeader(route, navigation), headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.background }, contentStyle: { backgroundColor: COLORS.background },
      })} />
      <Stack.Screen name="BMIScreen" component={BMIScreen} options={({ navigation, route }) => ({
        headerShown: true, header: () => renderToolHeader(route, navigation), headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.background }, contentStyle: { backgroundColor: COLORS.background },
      })} />
      <Stack.Screen name="SleepScreen" component={SleepScreen} options={({ navigation, route }) => ({
        headerShown: true, header: () => renderToolHeader(route, navigation), headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.background }, contentStyle: { backgroundColor: COLORS.background },
      })} />      
      <Stack.Screen name="WaterScreen" component={WaterScreen} options={({ navigation, route }) => ({
        headerShown: true, header: () => renderToolHeader(route, navigation), headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.background }, contentStyle: { backgroundColor: COLORS.background },
      })} />      
      
      {/* AI Sub-Tools (Rendered strictly in Root Stack to hide Tab Bar) */}
      <Stack.Screen name="AIDoctorScreen" component={AIDoctorScreen} />
      <Stack.Screen name="AIIngredientScreen" component={AIIngredientScreen} />
      <Stack.Screen name="AICalorieScreen" component={AICalorieScreen} />
      <Stack.Screen name="AIMealPlannerScreen" component={AIMealPlannerScreen} />
      
    </Stack.Navigator>
  );
}

// 4. Custom Tab Bar Styles
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', 
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 10,
  },
  floatingPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10, 
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 30,
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
    right: 16, 
    borderRadius: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});