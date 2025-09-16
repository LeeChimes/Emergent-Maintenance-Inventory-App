// frontend/app/components/ScanButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Props = {
  label?: string;
  type?: 'asset' | 'door' | 'delivery' | 'tool' | 'part';
  redirect?: string; // optional path to navigate AFTER scan (e.g. /ppms?mode=check)
  style?: ViewStyle;
};

export default function ScanButton({ label = 'Scan', type, redirect, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={() => {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (redirect) params.set('redirect', redirect);
        router.push(`/scan?${params.toString()}`);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open scanner${type ? ` for ${type}` : ''}`}
    >
      <Ionicons name="scan" size={18} color="#fff" />
      <Text style={styles.txt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  txt: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
