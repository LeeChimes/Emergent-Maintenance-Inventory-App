// frontend/app/scan.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// If you already created utils/qr.ts earlier, keep this import.
// If not yet, paste that file after this one and come back.
type QRType = 'asset' | 'door' | 'delivery' | 'tool' | 'part';
type QRPayload = { v: 1; t: QRType; id: string; extra?: Record<string, any> };

function parseQR(data: string): QRPayload | null {
  try {
    const obj = JSON.parse(data);
    if (!obj || typeof obj !== 'object') return null;
    if (obj.v !== 1) return null;
    if (!obj.t || !obj.id) return null;
    return obj as QRPayload;
  } catch {
    return null;
  }
}

export default function ScanScreen() {
  const [hasPerm, setHasPerm] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPerm(status === 'granted');
    })();
  }, []);

  const navigateFor = (p: QRPayload | null, raw: string) => {
    // Non-JSON barcodes (EAN/UPC/etc.): send to Inventory by default
    if (!p) {
      router.replace(`/inventory?scanned=1&t=unknown&id=${encodeURIComponent(raw)}`);
      return;
    }

    switch (p.t) {
      case 'door':
        router.replace(`/ppms?scanned=1&t=door&id=${encodeURIComponent(p.id)}`);
        break;
      case 'asset':
      case 'tool':
      case 'part':
        router.replace(`/inventory?scanned=1&t=${p.t}&id=${encodeURIComponent(p.id)}`);
        break;
      case 'delivery':
        router.replace(`/deliveries?scanned=1&t=delivery&id=${encodeURIComponent(p.id)}`);
        break;
      default:
        router.replace(`/inventory?scanned=1&t=${encodeURIComponent(p.t)}&id=${encodeURIComponent(p.id)}`);
        break;
    }
  };

  const onBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    try { await Haptics.selectionAsync(); } catch {}
    const parsed = parseQR(data);
    navigateFor(parsed, data);
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
      <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Ionicons name="alert-circle" size={28} color="#F59E0B" />
        <Text style={{ color: '#fff', marginTop: 10, fontWeight: '700' }}>Camera access denied</Text>
        <Text style={{ color: '#bbb', marginTop: 6, textAlign: 'center' }}>
          Enable camera permission in Settings to scan codes.
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
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : onBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.frame} />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: '#aaa' }}>Align code within the frame</Text>
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
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cameraWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: { borderWidth: 2, borderColor: '#4CAF50', width: 260, height: 260, borderRadius: 16 },
  footer: { padding: 16, alignItems: 'center', backgroundColor: '#111' },
  btn: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnTxt: { color: '#fff', fontWeight: '800' },
});
