import { DarkTheme as NavigationDarkTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const FITTECH_COLORS = {
  background: '#111111',
  surface: '#1E1E1E',
  primary: '#CCFF00',
  onPrimary: '#111111',
  text: '#FFFFFF',
  textMuted: '#A1A1AA',
  outline: '#333333',
};

const baseFonts = MD3DarkTheme.fonts;

export const fitTechPaperTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 20,
  fonts: {
    ...baseFonts,
    displayLarge: { ...baseFonts.displayLarge, fontFamily: 'System', fontWeight: '800' },
    displayMedium: { ...baseFonts.displayMedium, fontFamily: 'System', fontWeight: '800' },
    displaySmall: { ...baseFonts.displaySmall, fontFamily: 'System', fontWeight: '800' },
    headlineLarge: { ...baseFonts.headlineLarge, fontFamily: 'System', fontWeight: '800' },
    headlineMedium: { ...baseFonts.headlineMedium, fontFamily: 'System', fontWeight: '800' },
    headlineSmall: { ...baseFonts.headlineSmall, fontFamily: 'System', fontWeight: '800' },
    titleLarge: { ...baseFonts.titleLarge, fontFamily: 'System', fontWeight: '700' },
    titleMedium: { ...baseFonts.titleMedium, fontFamily: 'System', fontWeight: '700' },
    titleSmall: { ...baseFonts.titleSmall, fontFamily: 'System', fontWeight: '700' },
    labelLarge: { ...baseFonts.labelLarge, fontFamily: 'System', fontWeight: '700' },
    labelMedium: { ...baseFonts.labelMedium, fontFamily: 'System', fontWeight: '700' },
    labelSmall: { ...baseFonts.labelSmall, fontFamily: 'System', fontWeight: '700' },
    bodyLarge: { ...baseFonts.bodyLarge, fontFamily: 'System', fontWeight: '500' },
    bodyMedium: { ...baseFonts.bodyMedium, fontFamily: 'System', fontWeight: '500' },
    bodySmall: { ...baseFonts.bodySmall, fontFamily: 'System', fontWeight: '500' },
  },
  colors: {
    ...MD3DarkTheme.colors,
    primary: FITTECH_COLORS.primary,
    onPrimary: FITTECH_COLORS.onPrimary,
    background: FITTECH_COLORS.background,
    surface: FITTECH_COLORS.surface,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: FITTECH_COLORS.background,
      level1: FITTECH_COLORS.surface,
      level2: FITTECH_COLORS.surface,
      level3: FITTECH_COLORS.surface,
      level4: FITTECH_COLORS.surface,
      level5: FITTECH_COLORS.surface,
    },
    onBackground: FITTECH_COLORS.text,
    onSurface: FITTECH_COLORS.text,
    onSurfaceVariant: FITTECH_COLORS.textMuted,
    outline: FITTECH_COLORS.outline,
    outlineVariant: FITTECH_COLORS.outline,
    secondary: FITTECH_COLORS.textMuted,
    onSecondary: FITTECH_COLORS.text,
  },
};

export const fitTechNavigationTheme: NavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: FITTECH_COLORS.primary,
    background: FITTECH_COLORS.background,
    card: FITTECH_COLORS.background,
    text: FITTECH_COLORS.text,
    border: FITTECH_COLORS.outline,
    notification: FITTECH_COLORS.primary,
  },
};
