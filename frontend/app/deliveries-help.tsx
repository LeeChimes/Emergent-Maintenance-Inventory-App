// frontend/app/deliveries-help.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

export default function DeliveriesHelp() {
  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Deliveries Help" showBackButton />

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Ionicons name="help-circle" size={28} color="#4CAF50" />
            <Text style={styles.title}>How deliveries work</Text>
            <Text style={styles.text}>
              Use the Deliveries screen to track pending and received deliveries.
              Supervisors can mark items as received and update notes.
            </Text>
          </View>

          <View style={styles.section}>
            <Ionicons name="qr-code" size={28} color="#FF9800" />
            <Text style={styles.title}>Scanning tips</Text>
            <Text style={styles.text}>
              Tap the Scan button from the tab bar or the header to open the scanner.
              After scanning a delivery QR (e.g., DEL-001), the app will highlight
              that delivery on the Deliveries page automatically.
            </Text>
          </View>

          <View style={styles.section}>
            <Ionicons name="information-circle" size={28} color="#2196F3" />
            <Text style={styles.title}>Troubleshooting</Text>
            <Text style={styles.text}>
              • If a delivery doesn’t appear, pull to refresh.{'\n'}
              • If the QR code is damaged, search by ID in the search box.{'\n'}
              • Ask a supervisor to add missing delivery records.
            </Text>
          </View>
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  section: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 6 },
  text: { color: '#bbb', lineHeight: 20 },
});
