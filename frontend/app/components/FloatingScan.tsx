// frontend/app/components/FloatingScan.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

/**
 * Floating Scan button shown on every screen EXCEPT the scanner screen itself.
 * Tapping it opens /scan.
 */
export default function FloatingScan() {
  const pathname = usePathname();

  // Hide FAB on the scanner page to avoid overlaying the camera preview
  if (pathname?.startsWith('/scan')) return null;

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/scan')}
      accessibilityRole="button"
      accessibilityLabel="Open QR scanner"
    >
      <Ionicons name="qr-code" size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
