// frontend/app/components/QRBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  /** New prop name (preferred) */
  label?: string;     // e.g., "Door" or "Asset"
  /** Old prop name (kept for back-compat) */
  title?: string;     // e.g., "Door" or "Asset"
  value?: string;     // e.g., "FD-CORE8-012"
  subtitle?: string;  // optional small text
};

export default function QRBadge({ label, title, value = '-', subtitle }: Props) {
  const effectiveLabel = label ?? title ?? 'QR';
  return (
    <View style={styles.badge}>
      <Ionicons name="qr-code" size={20} color="#fff" />
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          {effectiveLabel}: <Text style={styles.value}>{value}</Text>
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3a3a3a',
  },
  text: { color: '#ddd', fontWeight: '700' },
  value: { color: '#fff' },
  subtitle: { color: '#999', fontSize: 12, marginTop: 2 },
});
