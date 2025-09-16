// frontend/app/generate-qr.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { buildQR, QRType } from '../utils/qr';
import QRBadge from './components/QRBadge';

const TYPES: QRType[] = ['asset', 'door', 'delivery', 'tool', 'part'];

export default function GenerateQRScreen() {
  const [type, setType] = useState<QRType>('asset');
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');

  const value = id ? buildQR(type, id, label ? { label } : undefined) : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Generate QR</Text>
        <Text style={styles.subtle}>Create labels for assets, fire doors, deliveries, tools, and parts.</Text>

        <View style={styles.row}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, type === t && styles.pillActive]}
              onPress={() => setType(t)}
              accessibilityLabel={`Set type ${t}`}
            >
              <Text style={type === t ? styles.pillTxtActive : styles.pillTxt}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder={`${type.toUpperCase()} ID (e.g., ${type === 'door' ? 'FD-CORE8-012' : 'ASSET-001'})`}
          placeholderTextColor="#888"
          value={id}
          onChangeText={setId}
        />
        <TextInput
          style={styles.input}
          placeholder="Label (optional, e.g., 'Pump 4')"
          placeholderTextColor="#888"
          value={label}
          onChangeText={setLabel}
        />

        {value ? (
          <View style={{ marginTop: 22, alignItems: 'center' }}>
            <QRBadge value={value} title={label || type.toUpperCase()} subtitle={id} />
          </View>
        ) : (
          <Text style={{ color: '#aaa', marginTop: 22 }}>Enter an ID to preview the QR code.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, backgroundColor: '#111' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtle: { color: '#aaa', marginTop: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  pill: {
    backgroundColor: '#2a2a2a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, marginBottom: 8,
  },
  pillActive: { backgroundColor: '#4CAF50' },
  pillTxt: { color: '#ccc', fontWeight: '700' },
  pillTxtActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#1d1d1d', color: '#fff', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#333',
  },
});
