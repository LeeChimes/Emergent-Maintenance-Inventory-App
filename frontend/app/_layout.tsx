// frontend/app/_layout.tsx
import React from 'react';
import { View, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import FloatingScan from './components/FloatingScan';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerShown: false, // we render our own headers via UniversalHeader
          contentStyle: { backgroundColor: '#111' },
        }}
      />
      {/* Global floating scan button on all screens (scan screen can hide it itself) */}
      <FloatingScan />
    </View>
  );
}
