// frontend/app/components/QRBadge.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import QRCodeSVG, { QRCode as QRInstance } from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Props = {
  value: string;          // already serialized (e.g., buildQR(...))
  title?: string;         // e.g., "Pump 4"
  subtitle?: string;      // e.g., "ASSET-123"
  size?: number;          // px
  onSaved?: (uri: string) => void;
};

export default function QRBadge({ value, title, subtitle, size = 180, onSaved }: Props) {
  const ref = useRef<QRInstance>(null);

  const onSave = () => {
    if (!ref.current) return;
    ref.current.toDataURL(async (data) => {
      try {
        const fileUri = FileSystem.cacheDirectory + `qr-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
        onSaved?.(fileUri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      } catch (e) {}
    });
  };

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={[styles.qrBox, { width: size + 20, height: size + 20 }]}>
        <QRCodeSVG value={value} size={size} backgroundColor="#fff" color="#000" getRef={(r) => (ref.current = r)} />
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <TouchableOpacity style={styles.saveBtn} onPress={onSave} accessibilityLabel="Save or share QR">
        <Text style={styles.saveTxt}>{Platform.OS === 'ios' ? 'Share / Save' : 'Save / Share'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 3,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#ddd', fontSize: 13, marginTop: 8 },
  saveBtn: {
    marginTop: 10, backgroundColor: '#374151', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
  },
  saveTxt: { color: '#fff', fontWeight: '700' },
});
