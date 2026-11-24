import { BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../lib/store';
import { C, F } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });
  const go = ready && (fontsLoaded || !!fontError);
  useEffect(() => { if (go) SplashScreen.hideAsync().catch(() => {}); }, [go]);
  if (!go) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: C.bg },
          headerTintColor: C.leaf,
          headerTitleStyle: { fontFamily: F.display, color: C.ink },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="cook/[id]" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="preferences" options={{ presentation: 'modal', title: 'Preferences' }} />
        <Stack.Screen name="saved" options={{ presentation: 'modal', title: 'Saved plans' }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
