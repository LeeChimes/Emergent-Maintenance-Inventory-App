// frontend/app/scan.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import { parseQR } from '../utils/qr';
import { ScanBus } from '../utils/ScanBus';
import { Ionicons } from '@expo/vector-icons';

export default function ScanScreen() {
  const params = useLocalSearchParams<{ type?: string; redirect?: string }>();
  const [hasPerm, setHasPerm] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPerm(status === 'granted');
    })();
  }, []);

  const onBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      await Haptics.selectionAsync();
    } catch {}
    // Broadcast raw result so any screen can react
    ScanBus.emit({ raw: data, ts: Date.now() });

    // If it’s our JSON payload, great. (Non-JSON barcodes still pass raw)
    const parsed = parseQR(data);

    // Optional redirect if provided
    const redirect = typeof params.redirect === 'string' ? params.redirect : null;
    if (redirect) {
      // place parsed data onto the redirect as query for convenience
      const q = new URLSearchParams();
      if (parsed?.t) q.set('t', parsed.t);
      if (parsed?.id) q.set('id', parsed.id);
      q.set('scanned', '1');
      router.replace(`${redirect}?${q.toString()}`);
      return;
    }

    // Default: go back to previous screen (it should subscribe to ScanBus)
    router.back();
  };

  if (hasPerm === null) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={{ color: '#ccc' }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (hasPerm === false) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Ionicons name="alert-circle" size={28} color="#F59E0B" />
        <Text style={{ color: '#fff', marginTop: 10, fontWeight: '700' }}>Camera access denied</Text>
        <Text style={{ color: '#bbb', marginTop: 6, textAlign: 'center', paddingHorizontal: 24 }}>
          Please enable camera permission in Settings to scan QR codes and barcodes.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close scanner">
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.cameraWrap}>
        <BarCodeScanner onBarCodeScanned={scanned ? undefined : onBarCodeScanned} style={StyleSheet.absoluteFillObject} />
        <View style={styles.frame} />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: '#aaa' }}>
          {params.type ? `Looking for ${params.type} code…` : 'Align code within the frame'}
        </Text>
        {scanned ? (
          <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={() => setScanned(false)}>
            <Text style={styles.btnTxt}>Scan Again</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cameraWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: {
    borderWidth: 2, borderColor: '#4CAF50', width: 260, height: 260, borderRadius: 16,
  },
  footer: { padding: 16, alignItems: 'center', backgroundColor: '#111' },
  btn: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnTxt: { color: '#fff', fontWeight: '800' },
});
