import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppErrorHandler } from '../utils/AppErrorHandler';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    // Initialize comprehensive error handling system
    AppErrorHandler.initialize();
  }, []);

  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="scanner" options={{ headerShown: false }} />
        <Stack.Screen name="inventory" options={{ headerShown: false }} />
        <Stack.Screen name="stock-take" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ 
          headerShown: true,
          title: "Smart Dashboard",
          headerStyle: { backgroundColor: '#2d2d2d' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/help')} style={{ marginRight: 16 }}>
              <Ionicons name="help-circle" size={24} color="#fff" />
            </TouchableOpacity>
          )
        }} />
        <Stack.Screen name="add-item" options={{ headerShown: false }} />
        <Stack.Screen name="bulk-upload" options={{ headerShown: false }} />
        <Stack.Screen name="suppliers" options={{ headerShown: false }} />
        <Stack.Screen name="deliveries" options={{ headerShown: false }} />
        <Stack.Screen name="audit-log" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="contact-supervisors" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}