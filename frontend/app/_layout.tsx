// frontend/app/_layout.tsx
import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import FloatingScan from './components/FloatingScan';
import { AppErrorHandler } from '../utils/AppErrorHandler';

export default function RootLayout() {
  useEffect(() => {
    // Initialize your global error handler (no-op if you don't use it)
    try { AppErrorHandler.initialize?.(); } catch {}

    // You can add other one-time app initializers here
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: '800' },
          contentStyle: { backgroundColor: '#111' },
        }}
      />
      {/* Global floating scan button, visible on all screens (except /scan itself, which hides it in the component) */}
      <FloatingScan />
    </View>
  );
}
