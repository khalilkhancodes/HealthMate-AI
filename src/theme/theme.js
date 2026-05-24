import { useColorScheme } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';

/**
 * src/theme/theme.js
 * Production-ready design tokens and `useTheme` hook for HealthMate AI
 * Exports semantic color palettes (light/dark), typography tokens (Inter),
 * spacing, radii, shadows and a `useTheme` hook that respects user preference.
 */

const LIGHT = {
  // Surfaces
  background: '#F7FAFC',
  surface: '#F0F4F8',
  card: '#FFFFFF',

  aiBackground: '#F7FAFC',
  aiSendMsg: '#126E56',
  aiReceiveMsg: '#E2E8F0',
  aiMsgInput: '#FFFFFF',
  sendMsgText: '#FFFFFF',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',

  // Brand
  primary: '#126E56',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DDF3EE',

  secondary: '#5B6472',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DFF0FF',

  tertiary: '#944A00',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE0CC',

  // Status
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#0EA5E9',

  // UI
  border: '#E6EEF6',
  inputBackground: '#F1F5F9',
  overlay: 'rgba(15,23,42,0.06)',

  // Helpers
  backdrop: 'rgba(2,6,23,0.45)',

  // Legacy aliases used across screens
  startGradient: 'rgba(92, 131, 183, 1)',
  endGradient: 'rgba(88, 145, 124, 1)',
  bigNumbers: '#FFFFFF',
  water: '#4AA9FF',
  sleep: '#FF9A4D',
  steps: '#4ADE80',
  heart: '#FB7185',
  BMI: '#0F172A',
  BMR: '#D97706',
  sleepbg: '#EEF7FF',
  waterbg: '#EAF5FF',
  stepsbg: '#EAFBF1',
  BMIbg: '#EEF2F7',
  purple: '#8B5CF6',
  orange: '#F97316',
  calories: '#EA580C',
  button: '#FFFFFF',
  inputField: '#F1F5F9',
};

const DARK = {
  // Surfaces
  background: '#111314',
  surface: '#0B1220',
  card: '#222627',

  aiBackground: '#1f1f1e',
  aiSendMsg: '#090909ff',
  aiReceiveMsg: '#2a2a2aff',
  aiMsgInput: '#2c2c2a',
  sendMsgText: '#FFFFFF',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',

  // Brand
  primary: '#2FBF9B',
  onPrimary: '#05231A',
  primaryContainer: '#05372C',

  secondary: '#94A3B8',
  onSecondary: '#0B1220',
  secondaryContainer: '#0E3A52',

  tertiary: '#FFB784',
  onTertiary: '#2D1700',
  tertiaryContainer: '#44250D',

  // Status
  success: '#4ADE80',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#38BDF8',

  // UI
  border: '#233240',
  inputBackground: '#0D1B2A',
  overlay: 'rgba(2,6,23,0.6)',

  // Helpers
  backdrop: 'rgba(0,0,0,0.6)',

  // Legacy aliases used across screens
  startGradient: 'rgba(92, 131, 183, 1)',
  endGradient: 'rgba(88, 145, 124, 1)',
  bigNumbers: '#FFFFFF',
  water: '#58B7FF',
  sleep: '#FFB26B',
  steps: '#4ADE80',
  heart: '#FB7185',
  BMI: '#F8FAFC',
  BMR: '#F59E0B',
  sleepbg: '#29221A',
  waterbg: '#0E2534',
  stepsbg: '#17301E',
  BMIbg: '#1B2430',
  purple: '#A78BFA',
  orange: '#FB923C',
  calories: '#F59E0B',
  button: '#0F1720',
  inputField: '#162235',
};

const FONTS = {
  family: 'Inter',
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },

  sizes: {
    display: 48,
    headingLarge: 32,
    headingMedium: 24,
    title: 20,
    body: 16,
    bodySmall: 14,
    label: 12,
  },

  lineHeights: {
    display: 56,
    headingLarge: 40,
    headingMedium: 32,
    title: 28,
    body: 22,
    bodySmall: 20,
    label: 16,
  },

  // Legacy aliases used by existing screens
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: 0.2,
    fontFamily: 'Inter',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 0.1,
    fontFamily: 'Inter',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  smallText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  bigNumbers: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
    fontFamily: 'Inter',
  },
  mediumNumbers: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    fontFamily: 'Inter',
  },
  smallNumbers: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  smallerNumbers: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  cardsubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  cardText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

const SHADOWS = (isDark) => ({
  none: {},
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.4 : 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.5 : 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
});

/**
 * useTheme
 * - Reads OS-level color scheme and user preference from Zustand store
 * - Returns combined tokens: COLORS, FONTS, SPACING, RADII, SHADOWS, flags
 */
export const useTheme = () => {
  const system = useColorScheme();
  const preference = useHealthStore((s) => s.themePreference) || 'system';

  const isDark =
    preference === 'dark' || (preference === 'system' && system === 'dark');

  const COLORS = isDark ? DARK : LIGHT;

  return {
    COLORS,
    FONTS,
    SPACING,
    RADII,
    SHADOWS: SHADOWS(isDark),
    isDark,
    themePreference: preference,
  };
};

export default {
  LIGHT,
  DARK,
  FONTS,
  SPACING,
  RADII,
  SHADOWS,
  useTheme,
};