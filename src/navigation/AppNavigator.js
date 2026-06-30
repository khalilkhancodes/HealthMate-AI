import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import SetupGoalsScreen from '../screens/SetupGoalsScreen';
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

// Routes where the floating "Ask AI" button should be hidden entirely.
const ASK_AI_HIDDEN_ROUTES = ['Profile', 'SetupGoalsScreen'];

let hasPlayedAskAiIntro = false;

// 1. The Ask AI Floating Button — icon-only, expands to show the label briefly
function AskAIFab({ onPress, COLORS, playIntro }) {
  const widthAnim = useRef(new Animated.Value(48)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const [showLabel, setShowLabel] = useState(false);
  const collapseTimer = useRef(null);

  // Only the very first time playIntro becomes true (i.e. the first time
  // this session the user is on Home) triggers the intro expand. Every
  // other screen, and every subsequent Home visit, stays icon-only.
  useEffect(() => {
    if (!playIntro || hasPlayedAskAiIntro) return;

    hasPlayedAskAiIntro = true;
    const introTimer = setTimeout(() => expand(2200), 600);
    return () => {
      clearTimeout(introTimer);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playIntro]);

  const expand = (autoCollapseAfter = 1800) => {
    setShowLabel(true);
    Animated.parallel([
      Animated.spring(widthAnim, { toValue: 120, useNativeDriver: false, friction: 8 }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 180, useNativeDriver: false }),
    ]).start();

    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => collapse(), autoCollapseAfter);
  };

  const collapse = () => {
    // Hide the label immediately so it isn't still occupying row space
    // while the container width animates down — that mismatch was causing
    // the icon to visually sit off-center during the shrink.
    setShowLabel(false);
    labelOpacity.setValue(0);
    Animated.spring(widthAnim, { toValue: 48, useNativeDriver: false, friction: 8 }).start();
  };

  const handlePress = () => {
    // Tapping while collapsed expands it instead of navigating immediately,
    // so the user always sees what they're about to tap into.
    if (widthAnim.__getValue ? widthAnim.__getValue() < 100 : true) {
      expand();
      return;
    }
    onPress();
  };

  return (
    <Animated.View style={[styles.fabContainer, { width: widthAnim }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.fabTouchable}>
        <LinearGradient
          colors={[COLORS.startGradient || COLORS.primary, COLORS.endGradient || COLORS.primary]}
          style={styles.fabGradient}
        >
          <View style={styles.fabIconWrap}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
          {showLabel && (
            <Animated.Text
              style={[styles.fabText, { opacity: labelOpacity }]}
              numberOfLines={1}
            >
              Ask AI
            </Animated.Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 2. The Custom Floating Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { COLORS, SPACING, RADII, SHADOWS, isDark } = useTheme();

  // Determine current active tab
  const currentRouteName = state.routes[state.index].name;
  const isAIHubActive = currentRouteName === 'AI Hub';
  const isAskAiHidden = ASK_AI_HIDDEN_ROUTES.includes(currentRouteName);
  const isHomeActive = currentRouteName === 'Home';

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom + 10 }]}>

      {!isAIHubActive && !isAskAiHidden && (
        <AskAIFab
          COLORS={COLORS}
          onPress={() => navigation.navigate('AIChatScreen')}
          playIntro={isHomeActive}
        />
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

// 3. The Main Tab Navigator
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

// 4. The Root Stack Navigator
export default function AppNavigator() {
  const { COLORS } = useTheme();

  const renderToolHeader = (route, navigation) => (
    <ToolHeader navigation={navigation} title={TOOL_TITLES[route.name] || route.name} />
  );

  return (
    <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Full-screen flows rendered outside the tab bar (no bottom nav, no Ask AI FAB) */}
      <Stack.Screen name="SetupGoalsScreen" component={SetupGoalsScreen} />

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

// 5. Custom Tab Bar Styles
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
    height: 48,
    borderRadius: 24,
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
  fabTouchable: {
    flex: 1,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fabIconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
    marginLeft: 8,
  },
});