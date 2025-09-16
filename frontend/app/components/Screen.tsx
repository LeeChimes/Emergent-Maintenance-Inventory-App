// frontend/app/components/Screen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
}

export default function Screen({ children, scroll }: ScreenProps) {
  if (scroll) {
    return <ScrollView style={styles.container}>{children}</ScrollView>;
  }
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
