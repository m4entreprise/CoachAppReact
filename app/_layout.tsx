import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { FITTECH_COLORS, fitTechNavigationTheme, fitTechPaperTheme } from '@/constants/fitTechTheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={fitTechNavigationTheme}>
      <PaperProvider
        theme={fitTechPaperTheme}
        settings={{
          icon: (props) => <MaterialCommunityIcons {...props} />,
        }}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: FITTECH_COLORS.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="workout/session"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="workout/summary"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="workout/day"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="profile/entry"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="profile/personal"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="profile/progress"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </PaperProvider>
    </ThemeProvider>
  );
}
