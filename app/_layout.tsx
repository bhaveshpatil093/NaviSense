import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDeviceStore } from '../store/deviceStore';
import Constants from 'expo-constants';
import { configureAudio } from '../utils/audio';
import { ErrorBoundary as CustomErrorBoundary } from '../components/ErrorBoundary';
import { useESP32 } from '../hooks/useESP32';


// Global error boundary caught by Expo Router
export { ErrorBoundary } from 'expo-router';

// Dynamically require expo-notifications only if not running in Expo Go
let Notifications: any = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('Failed to load expo-notifications', e);
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono-Bold': require('../assets/fonts/SpaceMono-Bold.ttf'),
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
  });

  const onboardingComplete = useDeviceStore((s) => s.onboardingComplete);
  const splashHidden = useRef<boolean>(false);
  const { pollOnce } = useESP32({ enablePolling: false });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        pollOnce();
      }
    });
    return () => subscription.remove();
  }, [pollOnce]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    configureAudio();
    if (Notifications) {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: true,
          }),
        });
        Notifications.requestPermissionsAsync().catch(() => {});
      } catch (e) {
        console.warn('Failed to initialize notifications', e);
      }
    }
  }, []);

  useEffect(() => {
    // Only attempt routing if fonts are loaded and hydration is potentially done
    if (fontsLoaded) {
      if (!onboardingComplete) {
        // use setImmediate or timeout to ensure layout is mounted before router.replace in Expo router
        setTimeout(() => {
          router.replace('/onboarding');
        }, 0);
      }
    }
  }, [fontsLoaded, onboardingComplete]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CustomErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sos" options={{ headerShown: false }} />
        </Stack>
      </CustomErrorBoundary>
    </SafeAreaProvider>
  );
}
