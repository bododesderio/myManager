import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initI18n } from '../services/i18n';
import { loadBrand } from '../services/brandLoader';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    // Initialize i18n and brand colors in parallel BEFORE rendering any screen.
    // Both are non-critical: failures fall back to seeded defaults in colors.ts / i18n.ts.
    Promise.allSettled([initI18n(), loadBrand()]).finally(() => setBootReady(true));
  }, []);

  if (!bootReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
              <Stack.Screen name="post/[id]" />
            </Stack>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
